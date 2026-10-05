package com.lifeflow.device;

import com.lifeflow.ambulance.Ambulance;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "medical_devices")
public class MedicalDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ambulance_id")
    private Ambulance ambulance;

    @Column(name = "device_uid", nullable = false, unique = true, length = 100)
    private String deviceUid;

    @Column(name = "device_type", nullable = false, length = 50)
    private String deviceType; // ECG, SPO2, NIBP, RESPIRATION, TEMPERATURE, CAPNOGRAPHY, GLUCOSE, DEFIBRILLATOR, VENTILATOR, INFUSION_PUMP

    @Column(length = 100)
    private String manufacturer;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "serial_number", length = 100)
    private String serialNumber;

    @Column(nullable = false, length = 50)
    private String status = "CONNECTED"; // CONNECTED, DISCONNECTED, DEGRADED, ERROR, STANDBY

    @Column(name = "battery_level")
    private Integer batteryLevel = 100;

    @Column(name = "calibration_status", length = 50)
    private String calibrationStatus = "CALIBRATED";

    @Column(name = "last_ping_at")
    private Instant lastPingAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public MedicalDevice() {}

    public MedicalDevice(Ambulance ambulance, String deviceUid, String deviceType, String manufacturer, String modelName, String serialNumber) {
        this.ambulance = ambulance;
        this.deviceUid = deviceUid;
        this.deviceType = deviceType;
        this.manufacturer = manufacturer;
        this.modelName = modelName;
        this.serialNumber = serialNumber;
        this.status = "CONNECTED";
        this.batteryLevel = 100;
        this.calibrationStatus = "CALIBRATED";
        this.lastPingAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Ambulance getAmbulance() { return ambulance; }
    public void setAmbulance(Ambulance ambulance) { this.ambulance = ambulance; }

    public String getDeviceUid() { return deviceUid; }
    public void setDeviceUid(String deviceUid) { this.deviceUid = deviceUid; }

    public String getDeviceType() { return deviceType; }
    public void setDeviceType(String deviceType) { this.deviceType = deviceType; }

    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getSerialNumber() { return serialNumber; }
    public void setSerialNumber(String serialNumber) { this.serialNumber = serialNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Integer getBatteryLevel() { return batteryLevel; }
    public void setBatteryLevel(Integer batteryLevel) { this.batteryLevel = batteryLevel; }

    public String getCalibrationStatus() { return calibrationStatus; }
    public void setCalibrationStatus(String calibrationStatus) { this.calibrationStatus = calibrationStatus; }

    public Instant getLastPingAt() { return lastPingAt; }
    public void setLastPingAt(Instant lastPingAt) { this.lastPingAt = lastPingAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
