package com.lifeflow.device;

import java.time.Instant;
import java.util.List;

public class DeviceDtos {

    public static class ObservationEventDto {
        private String eventId;
        private String patientCaseId;
        private Long ambulanceId;
        private Long deviceId;
        private String deviceUid;
        private String deviceType;
        private String metric;
        private Double value;
        private String unit;
        private Instant sourceTimestamp;
        private Instant gatewayTimestamp;
        private String quality; // GOOD, DEGRADED, POOR, INVALID, STALE
        private Double signalQuality; // 0.0 to 1.0
        private String provenance;
        private String deviceStatus;
        private Integer batteryStatus;
        private String calibrationStatus;
        private Long sequenceNumber;
        private String correlationId;

        public ObservationEventDto() {}

        public String getEventId() { return eventId; }
        public void setEventId(String eventId) { this.eventId = eventId; }

        public String getPatientCaseId() { return patientCaseId; }
        public void setPatientCaseId(String patientCaseId) { this.patientCaseId = patientCaseId; }

        public Long getAmbulanceId() { return ambulanceId; }
        public void setAmbulanceId(Long ambulanceId) { this.ambulanceId = ambulanceId; }

        public Long getDeviceId() { return deviceId; }
        public void setDeviceId(Long deviceId) { this.deviceId = deviceId; }

        public String getDeviceUid() { return deviceUid; }
        public void setDeviceUid(String deviceUid) { this.deviceUid = deviceUid; }

        public String getDeviceType() { return deviceType; }
        public void setDeviceType(String deviceType) { this.deviceType = deviceType; }

        public String getMetric() { return metric; }
        public void setMetric(String metric) { this.metric = metric; }

        public Double getValue() { return value; }
        public void setValue(Double value) { this.value = value; }

        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }

        public Instant getSourceTimestamp() { return sourceTimestamp; }
        public void setSourceTimestamp(Instant sourceTimestamp) { this.sourceTimestamp = sourceTimestamp; }

        public Instant getGatewayTimestamp() { return gatewayTimestamp; }
        public void setGatewayTimestamp(Instant gatewayTimestamp) { this.gatewayTimestamp = gatewayTimestamp; }

        public String getQuality() { return quality; }
        public void setQuality(String quality) { this.quality = quality; }

        public Double getSignalQuality() { return signalQuality; }
        public void setSignalQuality(Double signalQuality) { this.signalQuality = signalQuality; }

        public String getProvenance() { return provenance; }
        public void setProvenance(String provenance) { this.provenance = provenance; }

        public String getDeviceStatus() { return deviceStatus; }
        public void setDeviceStatus(String deviceStatus) { this.deviceStatus = deviceStatus; }

        public Integer getBatteryStatus() { return batteryStatus; }
        public void setBatteryStatus(Integer batteryStatus) { this.batteryStatus = batteryStatus; }

        public String getCalibrationStatus() { return calibrationStatus; }
        public void setCalibrationStatus(String calibrationStatus) { this.calibrationStatus = calibrationStatus; }

        public Long getSequenceNumber() { return sequenceNumber; }
        public void setSequenceNumber(Long sequenceNumber) { this.sequenceNumber = sequenceNumber; }

        public String getCorrelationId() { return correlationId; }
        public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }
    }

    public static class MedicalDeviceDto {
        private Long id;
        private Long ambulanceId;
        private String deviceUid;
        private String deviceType;
        private String manufacturer;
        private String modelName;
        private String status;
        private Integer batteryLevel;
        private String calibrationStatus;
        private Instant lastPingAt;

        public MedicalDeviceDto() {}

        public MedicalDeviceDto(Long id, Long ambulanceId, String deviceUid, String deviceType,
                                String manufacturer, String modelName, String status,
                                Integer batteryLevel, String calibrationStatus, Instant lastPingAt) {
            this.id = id;
            this.ambulanceId = ambulanceId;
            this.deviceUid = deviceUid;
            this.deviceType = deviceType;
            this.manufacturer = manufacturer;
            this.modelName = modelName;
            this.status = status;
            this.batteryLevel = batteryLevel;
            this.calibrationStatus = calibrationStatus;
            this.lastPingAt = lastPingAt;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Long getAmbulanceId() { return ambulanceId; }
        public void setAmbulanceId(Long ambulanceId) { this.ambulanceId = ambulanceId; }

        public String getDeviceUid() { return deviceUid; }
        public void setDeviceUid(String deviceUid) { this.deviceUid = deviceUid; }

        public String getDeviceType() { return deviceType; }
        public void setDeviceType(String deviceType) { this.deviceType = deviceType; }

        public String getManufacturer() { return manufacturer; }
        public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }

        public String getModelName() { return modelName; }
        public void setModelName(String modelName) { this.modelName = modelName; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public Integer getBatteryLevel() { return batteryLevel; }
        public void setBatteryLevel(Integer batteryLevel) { this.batteryLevel = batteryLevel; }

        public String getCalibrationStatus() { return calibrationStatus; }
        public void setCalibrationStatus(String calibrationStatus) { this.calibrationStatus = calibrationStatus; }

        public Instant getLastPingAt() { return lastPingAt; }
        public void setLastPingAt(Instant lastPingAt) { this.lastPingAt = lastPingAt; }
    }

    public static class SyncBatchRequest {
        private Long ambulanceId;
        private String correlationId;
        private List<ObservationEventDto> observations;

        public SyncBatchRequest() {}

        public Long getAmbulanceId() { return ambulanceId; }
        public void setAmbulanceId(Long ambulanceId) { this.ambulanceId = ambulanceId; }

        public String getCorrelationId() { return correlationId; }
        public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

        public List<ObservationEventDto> getObservations() { return observations; }
        public void setObservations(List<ObservationEventDto> observations) { this.observations = observations; }
    }

    public static class SyncBatchResponse {
        private String syncId;
        private int totalReceived;
        private int deduplicated;
        private int persisted;
        private String status;

        public SyncBatchResponse() {}

        public SyncBatchResponse(String syncId, int totalReceived, int deduplicated, int persisted, String status) {
            this.syncId = syncId;
            this.totalReceived = totalReceived;
            this.deduplicated = deduplicated;
            this.persisted = persisted;
            this.status = status;
        }

        public String getSyncId() { return syncId; }
        public void setSyncId(String syncId) { this.syncId = syncId; }

        public int getTotalReceived() { return totalReceived; }
        public void setTotalReceived(int totalReceived) { this.totalReceived = totalReceived; }

        public int getDeduplicated() { return deduplicated; }
        public void setDeduplicated(int deduplicated) { this.deduplicated = deduplicated; }

        public int getPersisted() { return persisted; }
        public void setPersisted(int persisted) { this.persisted = persisted; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }
}
