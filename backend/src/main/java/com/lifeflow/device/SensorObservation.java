package com.lifeflow.device;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "sensor_observations")
public class SensorObservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, unique = true, length = 100)
    private String eventId;

    @Column(name = "case_id", nullable = false, length = 100)
    private String caseId;

    @Column(name = "ambulance_id")
    private Long ambulanceId;

    @Column(name = "device_id")
    private Long deviceId;

    @Column(name = "device_uid", nullable = false, length = 100)
    private String deviceUid;

    @Column(name = "device_type", nullable = false, length = 50)
    private String deviceType;

    @Column(nullable = false, length = 50)
    private String metric;

    @Column(name = "value", nullable = false)
    private Double value;

    @Column(nullable = false, length = 30)
    private String unit;

    @Column(name = "source_timestamp", nullable = false)
    private Instant sourceTimestamp;

    @Column(name = "gateway_timestamp", nullable = false)
    private Instant gatewayTimestamp;

    @Column(nullable = false, length = 30)
    private String quality = "GOOD"; // GOOD, DEGRADED, POOR, INVALID, STALE

    @Column(name = "signal_quality")
    private Double signalQuality = 1.0;

    @Column(nullable = false, length = 100)
    private String provenance;

    @Column(name = "device_status", nullable = false, length = 50)
    private String deviceStatus;

    @Column(name = "battery_status")
    private Integer batteryStatus;

    @Column(name = "calibration_status", length = 50)
    private String calibrationStatus;

    @Column(name = "sequence_number", nullable = false)
    private Long sequenceNumber;

    @Column(name = "correlation_id", nullable = false, length = 100)
    private String correlationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public SensorObservation() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

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

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
