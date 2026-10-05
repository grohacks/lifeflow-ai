package com.lifeflow.patient;

import jakarta.validation.constraints.NotBlank;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public class PatientDtos {

    public static class PatientCaseDto {
        private Long id;
        private String caseId;
        private Long ambulanceId;
        private String vehicleNumber;
        private String patientIdentifier;
        private Integer age;
        private String gender;
        private String chiefComplaint;
        private String triageCategory;
        private String status;
        private Instant startedAt;
        private Double incidentLatitude;
        private Double incidentLongitude;
        private String incidentLocationAddress;

        public PatientCaseDto() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getCaseId() { return caseId; }
        public void setCaseId(String caseId) { this.caseId = caseId; }

        public Long getAmbulanceId() { return ambulanceId; }
        public void setAmbulanceId(Long ambulanceId) { this.ambulanceId = ambulanceId; }

        public String getVehicleNumber() { return vehicleNumber; }
        public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

        public String getPatientIdentifier() { return patientIdentifier; }
        public void setPatientIdentifier(String patientIdentifier) { this.patientIdentifier = patientIdentifier; }

        public Integer getAge() { return age; }
        public void setAge(Integer age) { this.age = age; }

        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }

        public String getChiefComplaint() { return chiefComplaint; }
        public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }

        public String getTriageCategory() { return triageCategory; }
        public void setTriageCategory(String triageCategory) { this.triageCategory = triageCategory; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public Instant getStartedAt() { return startedAt; }
        public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

        public Double getIncidentLatitude() { return incidentLatitude; }
        public void setIncidentLatitude(Double incidentLatitude) { this.incidentLatitude = incidentLatitude; }

        public Double getIncidentLongitude() { return incidentLongitude; }
        public void setIncidentLongitude(Double incidentLongitude) { this.incidentLongitude = incidentLongitude; }

        public String getIncidentLocationAddress() { return incidentLocationAddress; }
        public void setIncidentLocationAddress(String incidentLocationAddress) { this.incidentLocationAddress = incidentLocationAddress; }
    }

    public static class CreatePatientCaseRequest {
        @NotBlank(message = "Case ID is required")
        private String caseId;
        private Long ambulanceId;
        private String patientIdentifier;
        private Integer age;
        private String gender;
        private String chiefComplaint;
        private String triageCategory;

        public CreatePatientCaseRequest() {}

        public String getCaseId() { return caseId; }
        public void setCaseId(String caseId) { this.caseId = caseId; }

        public Long getAmbulanceId() { return ambulanceId; }
        public void setAmbulanceId(Long ambulanceId) { this.ambulanceId = ambulanceId; }

        public String getPatientIdentifier() { return patientIdentifier; }
        public void setPatientIdentifier(String patientIdentifier) { this.patientIdentifier = patientIdentifier; }

        public Integer getAge() { return age; }
        public void setAge(Integer age) { this.age = age; }

        public String getGender() { return gender; }
        public void setGender(String gender) { this.gender = gender; }

        public String getChiefComplaint() { return chiefComplaint; }
        public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }

        public String getTriageCategory() { return triageCategory; }
        public void setTriageCategory(String triageCategory) { this.triageCategory = triageCategory; }
    }

    public static class ParamedicObservationRequest {
        @NotBlank(message = "Case ID is required")
        private String caseId;
        private String consciousness; // ALERT, VERBAL, PAIN, UNRESPONSIVE
        private String airway;
        private String breathing;
        private String circulation;
        private String injury;
        private String bleeding;
        private Integer painScore;
        private String notes;

        public ParamedicObservationRequest() {}

        public String getCaseId() { return caseId; }
        public void setCaseId(String caseId) { this.caseId = caseId; }

        public String getConsciousness() { return consciousness; }
        public void setConsciousness(String consciousness) { this.consciousness = consciousness; }

        public String getAirway() { return airway; }
        public void setAirway(String airway) { this.airway = airway; }

        public String getBreathing() { return breathing; }
        public void setBreathing(String breathing) { this.breathing = breathing; }

        public String getCirculation() { return circulation; }
        public void setCirculation(String circulation) { this.circulation = circulation; }

        public String getInjury() { return injury; }
        public void setInjury(String injury) { this.injury = injury; }

        public String getBleeding() { return bleeding; }
        public void setBleeding(String bleeding) { this.bleeding = bleeding; }

        public Integer getPainScore() { return painScore; }
        public void setPainScore(Integer painScore) { this.painScore = painScore; }

        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class ParamedicInterventionRequest {
        @NotBlank(message = "Case ID is required")
        private String caseId;
        @NotBlank(message = "Intervention type is required")
        private String interventionType;
        private String details;
        private String dose;
        private String route;

        public ParamedicInterventionRequest() {}

        public String getCaseId() { return caseId; }
        public void setCaseId(String caseId) { this.caseId = caseId; }

        public String getInterventionType() { return interventionType; }
        public void setInterventionType(String interventionType) { this.interventionType = interventionType; }

        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }

        public String getDose() { return dose; }
        public void setDose(String dose) { this.dose = dose; }

        public String getRoute() { return route; }
        public void setRoute(String route) { this.route = route; }
    }

    public static class PatientTwinDto {
        private String caseId;
        private Instant timestamp;
        private Double heartRate;
        private Double spo2;
        private Double systolicBp;
        private Double diastolicBp;
        private Double mapValue;
        private Double respiratoryRate;
        private Double temperature;
        private Double etco2;
        private Double glucose;
        private String consciousness;
        private String injuryObservations;
        private String interventions;
        private Double confidence;
        private String dataQuality;
        private Map<String, Object> trendIndicators;
        private String correlationId;
        private Double incidentLatitude;
        private Double incidentLongitude;

        public PatientTwinDto() {}

        public String getCaseId() { return caseId; }
        public void setCaseId(String caseId) { this.caseId = caseId; }

        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

        public Double getHeartRate() { return heartRate; }
        public void setHeartRate(Double heartRate) { this.heartRate = heartRate; }

        public Double getSpo2() { return spo2; }
        public void setSpo2(Double spo2) { this.spo2 = spo2; }

        public Double getSystolicBp() { return systolicBp; }
        public void setSystolicBp(Double systolicBp) { this.systolicBp = systolicBp; }

        public Double getDiastolicBp() { return diastolicBp; }
        public void setDiastolicBp(Double diastolicBp) { this.diastolicBp = diastolicBp; }

        public Double getMapValue() { return mapValue; }
        public void setMapValue(Double mapValue) { this.mapValue = mapValue; }

        public Double getRespiratoryRate() { return respiratoryRate; }
        public void setRespiratoryRate(Double respiratoryRate) { this.respiratoryRate = respiratoryRate; }

        public Double getTemperature() { return temperature; }
        public void setTemperature(Double temperature) { this.temperature = temperature; }

        public Double getEtco2() { return etco2; }
        public void setEtco2(Double etco2) { this.etco2 = etco2; }

        public Double getGlucose() { return glucose; }
        public void setGlucose(Double glucose) { this.glucose = glucose; }

        public String getConsciousness() { return consciousness; }
        public void setConsciousness(String consciousness) { this.consciousness = consciousness; }

        public String getInjuryObservations() { return injuryObservations; }
        public void setInjuryObservations(String injuryObservations) { this.injuryObservations = injuryObservations; }

        public String getInterventions() { return interventions; }
        public void setInterventions(String interventions) { this.interventions = interventions; }

        public Double getConfidence() { return confidence; }
        public void setConfidence(Double confidence) { this.confidence = confidence; }

        public String getDataQuality() { return dataQuality; }
        public void setDataQuality(String dataQuality) { this.dataQuality = dataQuality; }

        public Map<String, Object> getTrendIndicators() { return trendIndicators; }
        public void setTrendIndicators(Map<String, Object> trendIndicators) { this.trendIndicators = trendIndicators; }

        public String getCorrelationId() { return correlationId; }
        public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

        public Double getIncidentLatitude() { return incidentLatitude; }
        public void setIncidentLatitude(Double incidentLatitude) { this.incidentLatitude = incidentLatitude; }

        public Double getIncidentLongitude() { return incidentLongitude; }
        public void setIncidentLongitude(Double incidentLongitude) { this.incidentLongitude = incidentLongitude; }
    }

    public static class PatientTimelineDto {
        private String caseId;
        private List<PatientObservation> observations;
        private List<PatientIntervention> interventions;
        private List<PatientImage> images;
        private List<PatientTwinState> twinHistory;

        public PatientTimelineDto() {}
        public PatientTimelineDto(String caseId, List<PatientObservation> observations,
                                  List<PatientIntervention> interventions, List<PatientImage> images,
                                  List<PatientTwinState> twinHistory) {
            this.caseId = caseId;
            this.observations = observations;
            this.interventions = interventions;
            this.images = images;
            this.twinHistory = twinHistory;
        }

        public String getCaseId() { return caseId; }
        public void setCaseId(String caseId) { this.caseId = caseId; }

        public List<PatientObservation> getObservations() { return observations; }
        public void setObservations(List<PatientObservation> observations) { this.observations = observations; }

        public List<PatientIntervention> getInterventions() { return interventions; }
        public void setInterventions(List<PatientIntervention> interventions) { this.interventions = interventions; }

        public List<PatientImage> getImages() { return images; }
        public void setImages(List<PatientImage> images) { this.images = images; }

        public List<PatientTwinState> getTwinHistory() { return twinHistory; }
        public void setTwinHistory(List<PatientTwinState> twinHistory) { this.twinHistory = twinHistory; }
    }
}
