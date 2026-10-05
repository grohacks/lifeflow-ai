package com.lifeflow.decision;

import com.lifeflow.hospital.Hospital;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "recommendations")
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recommendation_id", nullable = false, unique = true, length = 100)
    private String recommendationId;

    @Column(name = "case_id", nullable = false, length = 100)
    private String caseId;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber = 1;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "valid_until", nullable = false)
    private Instant validUntil;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_hospital_id")
    private Hospital selectedHospital;

    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion = "1.0.0";

    @Column(name = "uncertainty_score", nullable = false)
    private Double uncertaintyScore = 0.0;

    @Column(nullable = false, length = 50)
    private String status = "GENERATED"; // GENERATED, ACCEPTED, OVERRIDDEN, SUPERSEDED

    @Column(name = "summary_reason", columnDefinition = "TEXT")
    private String summaryReason;

    @Column(name = "data_snapshot_json", columnDefinition = "LONGTEXT")
    private String dataSnapshotJson;

    @Column(name = "correlation_id", nullable = false, length = 100)
    private String correlationId;

    @OneToMany(mappedBy = "recommendation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CandidateDestination> candidates = new ArrayList<>();

    public Recommendation() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRecommendationId() { return recommendationId; }
    public void setRecommendationId(String recommendationId) { this.recommendationId = recommendationId; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public Integer getVersionNumber() { return versionNumber; }
    public void setVersionNumber(Integer versionNumber) { this.versionNumber = versionNumber; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getValidUntil() { return validUntil; }
    public void setValidUntil(Instant validUntil) { this.validUntil = validUntil; }

    public Hospital getSelectedHospital() { return selectedHospital; }
    public void setSelectedHospital(Hospital selectedHospital) { this.selectedHospital = selectedHospital; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public Double getUncertaintyScore() { return uncertaintyScore; }
    public void setUncertaintyScore(Double uncertaintyScore) { this.uncertaintyScore = uncertaintyScore; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getSummaryReason() { return summaryReason; }
    public void setSummaryReason(String summaryReason) { this.summaryReason = summaryReason; }

    public String getDataSnapshotJson() { return dataSnapshotJson; }
    public void setDataSnapshotJson(String dataSnapshotJson) { this.dataSnapshotJson = dataSnapshotJson; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public List<CandidateDestination> getCandidates() { return candidates; }
    public void setCandidates(List<CandidateDestination> candidates) { this.candidates = candidates; }
}
