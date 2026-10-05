import numpy as np
from typing import List, Optional
from datetime import datetime
from .schemas import VitalDataPoint, ForecastResult, ForecastResponse

class PatientVitalForecaster:
    MODEL_NAME = "PatientVitalForecaster-LinearEWMA"
    MODEL_VERSION = "1.0.0"

    def forecast(self, case_id: str, metric: str, history: List[VitalDataPoint], horizons: List[int]) -> ForecastResponse:
        if not history or len(history) < 2:
            results = [
                ForecastResult(
                    horizon_minutes=h,
                    forecast_value=None,
                    lower_bound=None,
                    upper_bound=None,
                    confidence=0.0
                )
                for h in horizons
            ]
            return ForecastResponse(
                case_id=case_id,
                metric=metric,
                model_name=self.MODEL_NAME,
                model_version=self.MODEL_VERSION,
                forecasts=results,
                status="INSUFFICIENT_DATA"
            )

        # Sort chronologically
        sorted_history = sorted(history, key=lambda x: x.timestamp)
        t0 = sorted_history[0].timestamp.timestamp()
        times = np.array([(p.timestamp.timestamp() - t0) / 60.0 for p in sorted_history]) # minutes from start
        values = np.array([p.value for p in sorted_history])

        # Compute ordinary least squares trend slope & intercept
        # x_mean, y_mean
        n = len(times)
        x_mean = np.mean(times)
        y_mean = np.mean(values)

        denom = np.sum((times - x_mean) ** 2)
        if denom == 0:
            slope = 0.0
            intercept = y_mean
        else:
            slope = np.sum((times - x_mean) * (values - y_mean)) / denom
            intercept = y_mean - slope * x_mean

        # Residual standard error for confidence bands
        residuals = values - (intercept + slope * times)
        rse = np.std(residuals) if len(residuals) > 2 else 2.0
        rse = max(1.0, float(rse))

        last_time = times[-1]
        results = []

        for h in horizons:
            t_target = last_time + h
            # Projected linear forecast
            pred = float(intercept + slope * t_target)

            # Physiological bounds clamping
            if metric == "SPO2":
                pred = min(100.0, max(50.0, pred))
            elif metric == "HEART_RATE":
                pred = min(250.0, max(25.0, pred))
            elif metric == "RESPIRATORY_RATE":
                pred = min(60.0, max(5.0, pred))
            elif metric == "MAP":
                pred = min(180.0, max(30.0, pred))

            # Uncertainty expands as horizon increases (sqrt of time factor)
            uncertainty_spread = rse * np.sqrt(1.0 + (h / 10.0)) * 1.96
            lower_bound = max(0.0, pred - uncertainty_spread)
            upper_bound = pred + uncertainty_spread
            if metric == "SPO2":
                upper_bound = min(100.0, upper_bound)

            # Confidence declines over longer horizons
            confidence = max(0.40, min(0.98, 1.0 - (h * 0.015)))

            results.append(
                ForecastResult(
                    horizon_minutes=h,
                    forecast_value=round(pred, 1),
                    lower_bound=round(float(lower_bound), 1),
                    upper_bound=round(float(upper_bound), 1),
                    confidence=round(float(confidence), 2)
                )
            )

        return ForecastResponse(
            case_id=case_id,
            metric=metric,
            model_name=self.MODEL_NAME,
            model_version=self.MODEL_VERSION,
            forecasts=results,
            status="COMPLETED"
        )
