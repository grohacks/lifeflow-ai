package com.lifeflow.patient;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "patient_twin_states")
public class PatientTwinState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_id", nullable = false, length = 100)
    private String caseId;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "heart_rate")
    private Double heartRate;

    private Double spo2;

    @Column(name = "systolic_bp")
    private Double systolicBp;

    @Column(name = "diastolic_bp")
    private Double diastolicBp;

    @Column(name = "map_value")
    private Double mapValue;

    @Column(name = "respiratory_rate")
    private Double respiratoryRate;

    private Double temperature;
    private Double etco2;
    private Double glucose;

    @Column(length = 50)
    private String consciousness;

    @Column(name = "injury_observations", columnDefinition = "TEXT")
    private String injuryObservations;

    @Column(columnDefinition = "TEXT")
    private String interventions;

    @Column(nullable = false)
    private Double confidence = 1.0;

    @Column(name = "data_quality", nullable = false, length = 30)
    private String dataQuality = "GOOD";

    @Column(name = "trend_indicators_json", columnDefinition = "TEXT")
    private String trendIndicatorsJson;

    @Column(name = "correlation_id", nullable = false, length = 100)
    private String correlationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public PatientTwinState() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public String getTrendIndicatorsJson() { return trendIndicatorsJson; }
    public void setTrendIndicatorsJson(String trendIndicatorsJson) { this.trendIndicatorsJson = trendIndicatorsJson; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
