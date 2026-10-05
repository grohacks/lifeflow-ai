package com.lifeflow.incident;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "emergency_incidents")
public class EmergencyIncident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "incident_code", nullable = false, unique = true, length = 50)
    private String incidentCode;

    @Column(name = "bystander_name", length = 100)
    private String bystanderName;

    @Column(name = "bystander_phone", length = 50)
    private String bystanderPhone;

    @Column(name = "incident_type", nullable = false, length = 50)
    private String incidentType; // ROAD_ACCIDENT, CARDIAC_ARREST, FALL_TRAUMA, BURNS, OTHER

    @Column(nullable = false, length = 20)
    private String severity = "CRITICAL"; // CRITICAL, HIGH, MEDIUM

    @Column(name = "casualty_count", nullable = false)
    private Integer casualtyCount = 1;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "location_address")
    private String locationAddress;

    @Column(name = "photo_url", columnDefinition = "MEDIUMTEXT")
    private String photoUrl;

    @Column(name = "assigned_ambulance_id")
    private Long assignedAmbulanceId;

    @Column(nullable = false, length = 30)
    private String status = "REPORTED"; // REPORTED, ASSIGNED, EN_ROUTE_SCENE, ON_SCENE, PATIENT_LOADED, CANCELLED

    @Column(name = "reported_at", nullable = false)
    private Instant reportedAt = Instant.now();

    @Column(name = "dispatched_at")
    private Instant dispatchedAt;

    @Column(name = "arrived_scene_at")
    private Instant arrivedSceneAt;

    @Column(name = "patient_case_id", length = 50)
    private String patientCaseId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public EmergencyIncident() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getIncidentCode() { return incidentCode; }
    public void setIncidentCode(String incidentCode) { this.incidentCode = incidentCode; }

    public String getBystanderName() { return bystanderName; }
    public void setBystanderName(String bystanderName) { this.bystanderName = bystanderName; }

    public String getBystanderPhone() { return bystanderPhone; }
    public void setBystanderPhone(String bystanderPhone) { this.bystanderPhone = bystanderPhone; }

    public String getIncidentType() { return incidentType; }
    public void setIncidentType(String incidentType) { this.incidentType = incidentType; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public Integer getCasualtyCount() { return casualtyCount; }
    public void setCasualtyCount(Integer casualtyCount) { this.casualtyCount = casualtyCount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public String getLocationAddress() { return locationAddress; }
    public void setLocationAddress(String locationAddress) { this.locationAddress = locationAddress; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public Long getAssignedAmbulanceId() { return assignedAmbulanceId; }
    public void setAssignedAmbulanceId(Long assignedAmbulanceId) { this.assignedAmbulanceId = assignedAmbulanceId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getReportedAt() { return reportedAt; }
    public void setReportedAt(Instant reportedAt) { this.reportedAt = reportedAt; }

    public Instant getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(Instant dispatchedAt) { this.dispatchedAt = dispatchedAt; }

    public Instant getArrivedSceneAt() { return arrivedSceneAt; }
    public void setArrivedSceneAt(Instant arrivedSceneAt) { this.arrivedSceneAt = arrivedSceneAt; }

    public String getPatientCaseId() { return patientCaseId; }
    public void setPatientCaseId(String patientCaseId) { this.patientCaseId = patientCaseId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
