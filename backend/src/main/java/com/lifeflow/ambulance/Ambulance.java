package com.lifeflow.ambulance;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ambulances")
public class Ambulance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vehicle_number", nullable = false, unique = true, length = 50)
    private String vehicleNumber;

    @Column(name = "call_sign", nullable = false, unique = true, length = 50)
    private String callSign;

    @Column(length = 100)
    private String model;

    @Column(nullable = false, length = 50)
    private String status = "AVAILABLE"; // AVAILABLE, DISPATCHED, EN_ROUTE_SCENE, ON_SCENE, EN_ROUTE_HOSPITAL, AT_HOSPITAL, OUT_OF_SERVICE

    @Column(name = "base_station", length = 150)
    private String baseStation;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Ambulance() {}

    public Ambulance(String vehicleNumber, String callSign, String model, String baseStation) {
        this.vehicleNumber = vehicleNumber;
        this.callSign = callSign;
        this.model = model;
        this.baseStation = baseStation;
        this.status = "AVAILABLE";
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public String getCallSign() { return callSign; }
    public void setCallSign(String callSign) { this.callSign = callSign; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getBaseStation() { return baseStation; }
    public void setBaseStation(String baseStation) { this.baseStation = baseStation; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
