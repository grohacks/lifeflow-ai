package com.lifeflow.prealert;

import com.lifeflow.decision.Recommendation;
import com.lifeflow.hospital.Hospital;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "human_decisions")
public class HumanDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "decision_id", nullable = false, unique = true, length = 100)
    private String decisionId;

    @Column(name = "case_id", nullable = false, length = 100)
    private String caseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommendation_id")
    private Recommendation recommendation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_hospital_id", nullable = false)
    private Hospital selectedHospital;

    @Column(name = "decision_type", nullable = false, length = 50)
    private String decisionType; // ACCEPT, SELECT_ANOTHER, OVERRIDE

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "user_name", nullable = false, length = 100)
    private String userName;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion = "1.0.0";

    @Column(name = "correlation_id", nullable = false, length = 100)
    private String correlationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public HumanDecision() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDecisionId() { return decisionId; }
    public void setDecisionId(String decisionId) { this.decisionId = decisionId; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public Recommendation getRecommendation() { return recommendation; }
    public void setRecommendation(Recommendation recommendation) { this.recommendation = recommendation; }

    public Hospital getSelectedHospital() { return selectedHospital; }
    public void setSelectedHospital(Hospital selectedHospital) { this.selectedHospital = selectedHospital; }

    public String getDecisionType() { return decisionType; }
    public void setDecisionType(String decisionType) { this.decisionType = decisionType; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
