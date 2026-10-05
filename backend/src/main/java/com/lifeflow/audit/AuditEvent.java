package com.lifeflow.audit;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_events")
public class AuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", nullable = false, unique = true, length = 100)
    private String eventId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "actor_user", nullable = false, length = 100)
    private String actorUser;

    @Column(name = "case_id", length = 100)
    private String caseId;

    @Column(name = "ambulance_id")
    private Long ambulanceId;

    @Column(name = "hospital_id")
    private Long hospitalId;

    @Column(name = "previous_state_json", columnDefinition = "LONGTEXT")
    private String previousStateJson;

    @Column(name = "new_state_json", columnDefinition = "LONGTEXT")
    private String newStateJson;

    @Column(name = "recommendation_id")
    private Long recommendationId;

    @Column(name = "decision_id")
    private Long decisionId;

    @Column(name = "model_version", length = 50)
    private String modelVersion = "1.0.0";

    @Column(name = "correlation_id", nullable = false, length = 100)
    private String correlationId;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public AuditEvent() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getActorUser() { return actorUser; }
    public void setActorUser(String actorUser) { this.actorUser = actorUser; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public Long getAmbulanceId() { return ambulanceId; }
    public void setAmbulanceId(Long ambulanceId) { this.ambulanceId = ambulanceId; }

    public Long getHospitalId() { return hospitalId; }
    public void setHospitalId(Long hospitalId) { this.hospitalId = hospitalId; }

    public String getPreviousStateJson() { return previousStateJson; }
    public void setPreviousStateJson(String previousStateJson) { this.previousStateJson = previousStateJson; }

    public String getNewStateJson() { return newStateJson; }
    public void setNewStateJson(String newStateJson) { this.newStateJson = newStateJson; }

    public Long getRecommendationId() { return recommendationId; }
    public void setRecommendationId(Long recommendationId) { this.recommendationId = recommendationId; }

    public Long getDecisionId() { return decisionId; }
    public void setDecisionId(Long decisionId) { this.decisionId = decisionId; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
