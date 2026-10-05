package com.lifeflow.transport;

import com.lifeflow.ambulance.Ambulance;
import com.lifeflow.hospital.Hospital;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "routes")
public class Route {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ambulance_id", nullable = false)
    private Ambulance ambulance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @Column(name = "distance_km", nullable = false)
    private Double distanceKm;

    @Column(name = "base_duration_seconds", nullable = false)
    private Integer baseDurationSeconds = 0;

    @Column(name = "traffic_multiplier", nullable = false)
    private Double trafficMultiplier = 1.0; // 1.0 (Normal), 1.2 (Moderate), 1.5 (Heavy), 2.0 (Severe)

    @Column(name = "calculated_eta_seconds", nullable = false)
    private Integer calculatedEtaSeconds = 0;

    @Column(name = "waypoints_json", columnDefinition = "LONGTEXT")
    private String waypointsJson;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Route() {}

    public Route(Ambulance ambulance, Hospital hospital, Double distanceKm, Integer baseDurationSeconds, Double trafficMultiplier) {
        this.ambulance = ambulance;
        this.hospital = hospital;
        this.distanceKm = distanceKm;
        this.baseDurationSeconds = baseDurationSeconds;
        this.trafficMultiplier = trafficMultiplier;
        this.calculatedEtaSeconds = (int) Math.round(baseDurationSeconds * trafficMultiplier);
        this.isActive = true;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Ambulance getAmbulance() { return ambulance; }
    public void setAmbulance(Ambulance ambulance) { this.ambulance = ambulance; }

    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

    public Integer getBaseDurationSeconds() { return baseDurationSeconds; }
    public void setBaseDurationSeconds(Integer baseDurationSeconds) { this.baseDurationSeconds = baseDurationSeconds; }

    public Double getTrafficMultiplier() { return trafficMultiplier; }
    public void setTrafficMultiplier(Double trafficMultiplier) {
        this.trafficMultiplier = trafficMultiplier != null ? trafficMultiplier : 1.0;
        if (this.baseDurationSeconds != null) {
            this.calculatedEtaSeconds = (int) Math.round(this.baseDurationSeconds * this.trafficMultiplier);
        }
    }

    public Integer getCalculatedEtaSeconds() { return calculatedEtaSeconds; }
    public void setCalculatedEtaSeconds(Integer calculatedEtaSeconds) { this.calculatedEtaSeconds = calculatedEtaSeconds; }

    public String getWaypointsJson() { return waypointsJson; }
    public void setWaypointsJson(String waypointsJson) { this.waypointsJson = waypointsJson; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
