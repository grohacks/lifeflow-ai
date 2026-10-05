package com.lifeflow.device.adapters;

import com.lifeflow.device.DeviceDtos;
import com.lifeflow.device.MedicalDeviceAdapter;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.*;

public class SimulatedMedicalDeviceAdapters {

    public static abstract class BaseSimulatedAdapter implements MedicalDeviceAdapter {
        protected final String deviceUid;
        protected final String deviceType;
        protected boolean connected = true;

        public BaseSimulatedAdapter(String deviceUid, String deviceType) {
            this.deviceUid = deviceUid;
            this.deviceType = deviceType;
        }

        @Override
        public boolean connect() { this.connected = true; return true; }

        @Override
        public boolean disconnect() { this.connected = false; return true; }

        @Override
        public String getStatus() { return connected ? "CONNECTED" : "DISCONNECTED"; }

        @Override
        public String getDeviceType() { return deviceType; }

        @Override
        public String getDeviceUid() { return deviceUid; }

        @Override
        public Map<String, Object> getDeviceInfo() {
            Map<String, Object> info = new HashMap<>();
            info.put("deviceUid", deviceUid);
            info.put("deviceType", deviceType);
            info.put("status", getStatus());
            info.put("manufacturer", "LifeFlow SimDevices Inc.");
            return info;
        }

        protected DeviceDtos.ObservationEventDto createObs(String caseId, String metric, double value, String unit,
                                                          String quality, double signalQuality, Long seq, String corrId) {
            DeviceDtos.ObservationEventDto obs = new DeviceDtos.ObservationEventDto();
            obs.setEventId(UUID.randomUUID().toString());
            obs.setPatientCaseId(caseId);
            obs.setDeviceUid(deviceUid);
            obs.setDeviceType(deviceType);
            obs.setMetric(metric);
            obs.setValue(value);
            obs.setUnit(unit);
            obs.setSourceTimestamp(Instant.now());
            obs.setGatewayTimestamp(Instant.now());
            obs.setQuality(quality);
            obs.setSignalQuality(signalQuality);
            obs.setProvenance("SIMULATED_" + deviceType);
            obs.setDeviceStatus(getStatus());
            obs.setBatteryStatus(95);
            obs.setCalibrationStatus("CALIBRATED");
            obs.setSequenceNumber(seq);
            obs.setCorrelationId(corrId);
            return obs;
        }
    }

    @Component
    public static class SimulatedECGAdapter extends BaseSimulatedAdapter {
        public SimulatedECGAdapter() { super("DEV-ECG-001", "ECG"); }
        @Override
        public List<DeviceDtos.ObservationEventDto> generateObservations(String caseId, Long seq, String corrId) {
            return List.of(createObs(caseId, "HEART_RATE", 110.0, "bpm", "GOOD", 0.98, seq, corrId));
        }
    }

    @Component
    public static class SimulatedSpO2Adapter extends BaseSimulatedAdapter {
        public SimulatedSpO2Adapter() { super("DEV-SPO2-001", "SPO2"); }
        @Override
        public List<DeviceDtos.ObservationEventDto> generateObservations(String caseId, Long seq, String corrId) {
            return List.of(createObs(caseId, "SPO2", 95.0, "%", "GOOD", 0.96, seq, corrId));
        }
    }

    @Component
    public static class SimulatedBPAdapter extends BaseSimulatedAdapter {
        public SimulatedBPAdapter() { super("DEV-NIBP-001", "NIBP"); }
        @Override
        public List<DeviceDtos.ObservationEventDto> generateObservations(String caseId, Long seq, String corrId) {
            double sys = 110.0;
            double dia = 70.0;
            double map = dia + (sys - dia) / 3.0; // Mean Arterial Pressure calculation
            return List.of(
                    createObs(caseId, "SYSTOLIC_BP", sys, "mmHg", "GOOD", 0.95, seq, corrId),
                    createObs(caseId, "DIASTOLIC_BP", dia, "mmHg", "GOOD", 0.95, seq, corrId),
                    createObs(caseId, "MAP", Math.round(map * 10.0) / 10.0, "mmHg", "GOOD", 0.95, seq, corrId)
            );
        }
    }

    @Component
    public static class SimulatedRespirationAdapter extends BaseSimulatedAdapter {
        public SimulatedRespirationAdapter() { super("DEV-RESP-001", "RESPIRATION"); }
        @Override
        public List<DeviceDtos.ObservationEventDto> generateObservations(String caseId, Long seq, String corrId) {
            return List.of(createObs(caseId, "RESPIRATORY_RATE", 22.0, "breaths/min", "GOOD", 0.94, seq, corrId));
        }
    }

    @Component
    public static class SimulatedTemperatureAdapter extends BaseSimulatedAdapter {
        public SimulatedTemperatureAdapter() { super("DEV-TEMP-001", "TEMPERATURE"); }
        @Override
        public List<DeviceDtos.ObservationEventDto> generateObservations(String caseId, Long seq, String corrId) {
            return List.of(createObs(caseId, "TEMPERATURE", 37.1, "°C", "GOOD", 0.99, seq, corrId));
        }
    }

    @Component
    public static class SimulatedEtCO2Adapter extends BaseSimulatedAdapter {
        public SimulatedEtCO2Adapter() { super("DEV-ETCO2-001", "CAPNOGRAPHY"); }
        @Override
        public List<DeviceDtos.ObservationEventDto> generateObservations(String caseId, Long seq, String corrId) {
            return List.of(createObs(caseId, "ETCO2", 36.0, "mmHg", "GOOD", 0.95, seq, corrId));
        }
    }

    @Component
    public static class SimulatedGlucoseAdapter extends BaseSimulatedAdapter {
        public SimulatedGlucoseAdapter() { super("DEV-GLU-001", "GLUCOSE"); }
        @Override
        public List<DeviceDtos.ObservationEventDto> generateObservations(String caseId, Long seq, String corrId) {
            return List.of(createObs(caseId, "GLUCOSE", 115.0, "mg/dL", "GOOD", 0.98, seq, corrId));
        }
    }

    @Component
    public static class SimulatedDefibrillatorAdapter extends BaseSimulatedAdapter {
        public SimulatedDefibrillatorAdapter() { super("DEV-DEFIB-001", "DEFIBRILLATOR"); }
        @Override
        public List<DeviceDtos.ObservationEventDto> generateObservations(String caseId, Long seq, String corrId) {
            return List.of(createObs(caseId, "RHYTHM_NORMAL", 1.0, "bool", "GOOD", 1.0, seq, corrId));
        }
    }

    @Component
    public static class SimulatedVentilatorAdapter extends BaseSimulatedAdapter {
        public SimulatedVentilatorAdapter() { super("DEV-VENT-001", "VENTILATOR"); }
        @Override
        public List<DeviceDtos.ObservationEventDto> generateObservations(String caseId, Long seq, String corrId) {
            return List.of(
                    createObs(caseId, "VENT_FIO2", 40.0, "%", "GOOD", 0.99, seq, corrId),
                    createObs(caseId, "VENT_PEEP", 5.0, "cmH2O", "GOOD", 0.99, seq, corrId),
                    createObs(caseId, "VENT_TIDAL_VOLUME", 450.0, "mL", "GOOD", 0.98, seq, corrId)
            );
        }
    }

    @Component
    public static class SimulatedInfusionPumpAdapter extends BaseSimulatedAdapter {
        public SimulatedInfusionPumpAdapter() { super("DEV-PUMP-001", "INFUSION_PUMP"); }
        @Override
        public List<DeviceDtos.ObservationEventDto> generateObservations(String caseId, Long seq, String corrId) {
            return List.of(createObs(caseId, "INFUSION_RATE", 100.0, "mL/hr", "GOOD", 0.99, seq, corrId));
        }
    }
}
