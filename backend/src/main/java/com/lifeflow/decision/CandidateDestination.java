package com.lifeflow.decision;

import com.lifeflow.hospital.Hospital;
import jakarta.persistence.*;

@Entity
@Table(name = "candidate_destinations")
public class CandidateDestination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommendation_id", nullable = false)
    private Recommendation recommendation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @Column(name = "eta_seconds", nullable = false)
    private Integer etaSeconds;

    @Column(name = "distance_km", nullable = false)
    private Double distanceKm;

    @Column(nullable = false, length = 30)
    private String feasibility = "FEASIBLE"; // FEASIBLE, INFEASIBLE

    @Column(name = "clinical_fit_score", nullable = false)
    private Double clinicalFitScore;

    @Column(name = "future_resource_score", nullable = false)
    private Double futureResourceScore;

    @Column(name = "transport_utility_score", nullable = false)
    private Double transportUtilityScore;

    @Column(name = "patient_compatibility_score", nullable = false)
    private Double patientCompatibilityScore;

    @Column(name = "operational_capacity_score", nullable = false)
    private Double operationalCapacityScore;

    @Column(name = "uncertainty_penalty", nullable = false)
    private Double uncertaintyPenalty;

    @Column(name = "overall_suitability_score", nullable = false)
    private Double overallSuitabilityScore;

    @Column(name = "rank_order", nullable = false)
    private Integer rankOrder;

    @Column(name = "is_recommended", nullable = false)
    private Boolean isRecommended = false;

    @OneToOne(mappedBy = "candidateDestination", cascade = CascadeType.ALL, orphanRemoval = true)
    private DestinationEvaluation evaluation;

    public CandidateDestination() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Recommendation getRecommendation() { return recommendation; }
    public void setRecommendation(Recommendation recommendation) { this.recommendation = recommendation; }

    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }

    public Integer getEtaSeconds() { return etaSeconds; }
    public void setEtaSeconds(Integer etaSeconds) { this.etaSeconds = etaSeconds; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

    public String getFeasibility() { return feasibility; }
    public void setFeasibility(String feasibility) { this.feasibility = feasibility; }

    public Double getClinicalFitScore() { return clinicalFitScore; }
    public void setClinicalFitScore(Double clinicalFitScore) { this.clinicalFitScore = clinicalFitScore; }

    public Double getFutureResourceScore() { return futureResourceScore; }
    public void setFutureResourceScore(Double futureResourceScore) { this.futureResourceScore = futureResourceScore; }

    public Double getTransportUtilityScore() { return transportUtilityScore; }
    public void setTransportUtilityScore(Double transportUtilityScore) { this.transportUtilityScore = transportUtilityScore; }

    public Double getPatientCompatibilityScore() { return patientCompatibilityScore; }
    public void setPatientCompatibilityScore(Double patientCompatibilityScore) { this.patientCompatibilityScore = patientCompatibilityScore; }

    public Double getOperationalCapacityScore() { return operationalCapacityScore; }
    public void setOperationalCapacityScore(Double operationalCapacityScore) { this.operationalCapacityScore = operationalCapacityScore; }

    public Double getUncertaintyPenalty() { return uncertaintyPenalty; }
    public void setUncertaintyPenalty(Double uncertaintyPenalty) { this.uncertaintyPenalty = uncertaintyPenalty; }

    public Double getOverallSuitabilityScore() { return overallSuitabilityScore; }
    public void setOverallSuitabilityScore(Double overallSuitabilityScore) { this.overallSuitabilityScore = overallSuitabilityScore; }

    public Integer getRankOrder() { return rankOrder; }
    public void setRankOrder(Integer rankOrder) { this.rankOrder = rankOrder; }

    public Boolean getIsRecommended() { return isRecommended; }
    public void setIsRecommended(Boolean isRecommended) { this.isRecommended = isRecommended; }

    public DestinationEvaluation getEvaluation() { return evaluation; }
    public void setEvaluation(DestinationEvaluation evaluation) { this.evaluation = evaluation; }
}
