package com.lifeflow.decision;

import java.time.Instant;
import java.util.List;

public class DecisionDtos {

    public static class RecommendationDto {
        private Long id;
        private String recommendationId;
        private String caseId;
        private Integer versionNumber;
        private Boolean isActive;
        private Instant createdAt;
        private Instant validUntil;
        private Long selectedHospitalId;
        private String selectedHospitalName;
        private String modelVersion;
        private Double uncertaintyScore;
        private String status;
        private String summaryReason;
        private List<CandidateDestinationDto> candidates;

        public RecommendationDto() {}

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

        public Long getSelectedHospitalId() { return selectedHospitalId; }
        public void setSelectedHospitalId(Long selectedHospitalId) { this.selectedHospitalId = selectedHospitalId; }

        public String getSelectedHospitalName() { return selectedHospitalName; }
        public void setSelectedHospitalName(String selectedHospitalName) { this.selectedHospitalName = selectedHospitalName; }

        public String getModelVersion() { return modelVersion; }
        public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

        public Double getUncertaintyScore() { return uncertaintyScore; }
        public void setUncertaintyScore(Double uncertaintyScore) { this.uncertaintyScore = uncertaintyScore; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public String getSummaryReason() { return summaryReason; }
        public void setSummaryReason(String summaryReason) { this.summaryReason = summaryReason; }

        public List<CandidateDestinationDto> getCandidates() { return candidates; }
        public void setCandidates(List<CandidateDestinationDto> candidates) { this.candidates = candidates; }
    }

    public static class CandidateDestinationDto {
        private Long id;
        private Long hospitalId;
        private String hospitalName;
        private String hospitalCode;
        private Integer etaSeconds;
        private Integer etaMinutes;
        private Double distanceKm;
        private String feasibility; // FEASIBLE, INFEASIBLE
        private Double clinicalFitScore;
        private Double futureResourceScore;
        private Double transportUtilityScore;
        private Double patientCompatibilityScore;
        private Double operationalCapacityScore;
        private Double uncertaintyPenalty;
        private Double overallSuitabilityScore;
        private Integer rankOrder;
        private Boolean isRecommended;
        private DestinationEvaluationDto evaluation;

        public CandidateDestinationDto() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Long getHospitalId() { return hospitalId; }
        public void setHospitalId(Long hospitalId) { this.hospitalId = hospitalId; }

        public String getHospitalName() { return hospitalName; }
        public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

        public String getHospitalCode() { return hospitalCode; }
        public void setHospitalCode(String hospitalCode) { this.hospitalCode = hospitalCode; }

        public Integer getEtaSeconds() { return etaSeconds; }
        public void setEtaSeconds(Integer etaSeconds) {
            this.etaSeconds = etaSeconds;
            this.etaMinutes = (int) Math.round(etaSeconds / 60.0);
        }

        public Integer getEtaMinutes() { return etaMinutes; }
        public void setEtaMinutes(Integer etaMinutes) { this.etaMinutes = etaMinutes; }

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

        public DestinationEvaluationDto getEvaluation() { return evaluation; }
        public void setEvaluation(DestinationEvaluationDto evaluation) { this.evaluation = evaluation; }
    }

    public static class DestinationEvaluationDto {
        private List<String> positiveFactors;
        private List<String> negativeFactors;
        private List<String> hardConstraints;
        private List<String> uncertaintyFactors;
        private String patientForecastSummary;
        private String hospitalForecastSummary;
        private String transportSummary;

        public DestinationEvaluationDto() {}

        public List<String> getPositiveFactors() { return positiveFactors; }
        public void setPositiveFactors(List<String> positiveFactors) { this.positiveFactors = positiveFactors; }

        public List<String> getNegativeFactors() { return negativeFactors; }
        public void setNegativeFactors(List<String> negativeFactors) { this.negativeFactors = negativeFactors; }

        public List<String> getHardConstraints() { return hardConstraints; }
        public void setHardConstraints(List<String> hardConstraints) { this.hardConstraints = hardConstraints; }

        public List<String> getUncertaintyFactors() { return uncertaintyFactors; }
        public void setUncertaintyFactors(List<String> uncertaintyFactors) { this.uncertaintyFactors = uncertaintyFactors; }

        public String getPatientForecastSummary() { return patientForecastSummary; }
        public void setPatientForecastSummary(String patientForecastSummary) { this.patientForecastSummary = patientForecastSummary; }

        public String getHospitalForecastSummary() { return hospitalForecastSummary; }
        public void setHospitalForecastSummary(String hospitalForecastSummary) { this.hospitalForecastSummary = hospitalForecastSummary; }

        public String getTransportSummary() { return transportSummary; }
        public void setTransportSummary(String transportSummary) { this.transportSummary = transportSummary; }
    }
}
