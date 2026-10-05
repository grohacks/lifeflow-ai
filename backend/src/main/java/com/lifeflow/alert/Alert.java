package com.lifeflow.alert;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "alert_id", nullable = false, unique = true, length = 100)
    private String alertId;

    @Column(name = "case_id", length = 100)
    private String caseId;

    @Column(name = "ambulance_id")
    private Long ambulanceId;

    @Column(name = "hospital_id")
    private Long hospitalId;

    @Column(name = "alert_type", nullable = false, length = 50)
    private String alertType; // CRITICAL_VITAL_CHANGE, PATIENT_DETERIORATION, GPS_LOST, NETWORK_LOST, DEVICE_FAILURE, ETA_CHANGED, HOSPITAL_RESOURCE_CHANGED, HOSPITAL_DATA_STALE, DESTINATION_CHANGED, PREALERT_PENDING, SYSTEM_ERROR

    @Column(nullable = false, length = 30)
    private String severity = "WARNING"; // INFO, WATCH, WARNING, CRITICAL, DATA_QUALITY_ALERT

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 100)
    private String source;

    @Column(nullable = false, length = 50)
    private String status = "ACTIVE"; // ACTIVE, ACKNOWLEDGED, ESCALATED, RESOLVED

    @Column(nullable = false)
    private boolean acknowledged = false;

    @Column(name = "acknowledged_by", length = 100)
    private String acknowledgedBy;

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "alert", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<AlertEscalation> escalations = new ArrayList<>();

    public Alert() {}

    public Alert(String alertId, String caseId, String alertType, String severity, String message, String source) {
        this.alertId = alertId;
        this.caseId = caseId;
        this.alertType = alertType;
        this.severity = severity;
        this.message = message;
        this.source = source;
        this.timestamp = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getAlertId() { return alertId; }
    public void setAlertId(String alertId) { this.alertId = alertId; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public Long getAmbulanceId() { return ambulanceId; }
    public void setAmbulanceId(Long ambulanceId) { this.ambulanceId = ambulanceId; }

    public Long getHospitalId() { return hospitalId; }
    public void setHospitalId(Long hospitalId) { this.hospitalId = hospitalId; }

    public String getAlertType() { return alertType; }
    public void setAlertType(String alertType) { this.alertType = alertType; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isAcknowledged() { return acknowledged; }
    public void setAcknowledged(boolean acknowledged) { this.acknowledged = acknowledged; }

    public String getAcknowledgedBy() { return acknowledgedBy; }
    public void setAcknowledgedBy(String acknowledgedBy) { this.acknowledgedBy = acknowledgedBy; }

    public Instant getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(Instant acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public List<AlertEscalation> getEscalations() { return escalations; }
    public void setEscalations(List<AlertEscalation> escalations) { this.escalations = escalations; }
}
