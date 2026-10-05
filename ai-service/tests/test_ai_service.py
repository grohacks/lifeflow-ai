import pytest
from datetime import datetime, timedelta
from app.schemas import VitalDataPoint
from app.forecasting import PatientVitalForecaster
from app.vision import LocalInjuryVisionAnalyzer
from io import BytesIO
from PIL import Image

def test_forecaster_insufficient_data():
    forecaster = PatientVitalForecaster()
    res = forecaster.forecast("CASE-001", "HEART_RATE", [], [5, 10])
    assert res.status == "INSUFFICIENT_DATA"
    assert res.forecasts[0].forecast_value is None

def test_forecaster_linear_trend():
    forecaster = PatientVitalForecaster()
    t0 = datetime.now()
    history = [
        VitalDataPoint(timestamp=t0, value=110.0),
        VitalDataPoint(timestamp=t0 + timedelta(minutes=1), value=115.0),
        VitalDataPoint(timestamp=t0 + timedelta(minutes=2), value=120.0),
    ]
    res = forecaster.forecast("CASE-001", "HEART_RATE", history, [5, 10])
    assert res.status == "COMPLETED"
    assert len(res.forecasts) == 2
    # At +5 min, value should project upwards (~135.0)
    assert res.forecasts[0].forecast_value > 120.0
    assert res.forecasts[0].confidence > 0.5

def test_vision_analyzer():
    analyzer = LocalInjuryVisionAnalyzer()
    img = Image.new("RGB", (100, 100), color=(200, 50, 50)) # Reddish image
    buf = BytesIO()
    img.save(buf, format="JPEG")
    res = analyzer.analyze_image(buf.getvalue())
    assert "requires human confirmation" in res.requires_human_confirmation
    assert res.confidence > 0.5

def test_handover_generator():
    from app.handover import EmergencyHandoverGenerator
    generator = EmergencyHandoverGenerator()
    res = generator.generate_sbar_handover({
        "case_id": "CASE-TEST-01",
        "latest_vitals": {"heartRate": 125, "systolicBp": 90, "spo2": 91},
        "target_hospital": "Apollo Center",
        "eta_minutes": 10
    })
    assert "sbar" in res
    assert "situation" in res["sbar"]
    assert "assessment" in res["sbar"]
    assert res["requires_clinical_review"] is True

def test_assistant_query():
    from app.assistant import LocalOllamaAssistant
    assistant = LocalOllamaAssistant()
    res = assistant.query("Why did the destination evaluation change?", {
        "case_id": "CASE-TEST-01",
        "vitals": {"heartRate": 120, "systolicBp": 92, "spo2": 92},
        "target_hospital": "Apollo Emergency"
    })
    assert res["grounded"] is True
    assert len(res["answer"]) > 20
    assert "Apollo Emergency" in res["answer"] or "traffic" in res["answer"]
