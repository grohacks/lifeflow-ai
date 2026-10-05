package com.lifeflow.device.gateway;

import java.util.Map;

public interface MedicalDeviceConnector {
    String getConnectorId();
    String getDeviceType(); // ECG, SPO2, NIBP, ETCO2, GLUCOSE, TEMPERATURE, VENTILATOR, DEFIBRILLATOR
    MedicalDeviceProtocol getProtocol();
    boolean connect(Map<String, Object> connectionParams);
    void disconnect();
    boolean isConnected();
    void subscribeTelemetry(DeviceTelemetryConsumer consumer);

    interface DeviceTelemetryConsumer {
        void onTelemetryReceived(String deviceUid, String metric, double value, String unit, double signalQuality, long timestamp);
    }
}
