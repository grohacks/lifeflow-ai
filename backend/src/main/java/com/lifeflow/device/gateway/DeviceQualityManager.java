package com.lifeflow.device.gateway;

import org.springframework.stereotype.Component;

@Component
public class DeviceQualityManager {

    public enum SignalQualityLevel {
        EXCELLENT,
        ACCEPTABLE,
        DEGRADED,
        NOISY,
        DROPOUT
    }

    public SignalQualityLevel assessSignalQuality(String metric, double value, double rawQualityScore) {
        if (rawQualityScore < 0.2) return SignalQualityLevel.DROPOUT;
        if (rawQualityScore < 0.5) return SignalQualityLevel.NOISY;
        if (rawQualityScore < 0.75) return SignalQualityLevel.DEGRADED;
        if (rawQualityScore < 0.90) return SignalQualityLevel.ACCEPTABLE;
        return SignalQualityLevel.EXCELLENT;
    }

    public boolean isPhysiologicallyPlausible(String metric, double value) {
        return switch (metric.toUpperCase()) {
            case "HEART_RATE" -> value >= 20.0 && value <= 280.0;
            case "SPO2" -> value >= 40.0 && value <= 100.0;
            case "SYSTOLIC_BP" -> value >= 30.0 && value <= 300.0;
            case "DIASTOLIC_BP" -> value >= 10.0 && value <= 200.0;
            case "RESPIRATORY_RATE" -> value >= 3.0 && value <= 80.0;
            case "ETCO2" -> value >= 5.0 && value <= 100.0;
            case "TEMPERATURE" -> value >= 25.0 && value <= 45.0;
            case "GLUCOSE" -> value >= 10.0 && value <= 1000.0;
            default -> true;
        };
    }
}
