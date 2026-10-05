package com.lifeflow.patient;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "patient_forecasts")
public class PatientForecast {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_id", nullable = false, length = 100)
    private String caseId;

    @Column(name = "horizon_minutes", nullable = false)
    private Integer horizonMinutes; // 5, 10, 15, 20, 30

    @Column(name = "forecast_timestamp", nullable = false)
    private Instant forecastTimestamp;

    @Column(nullable = false, length = 50)
    private String metric; // HEART_RATE, SPO2, MAP, RESPIRATORY_RATE

    @Column(name = "forecast_value")
    private Double forecastValue;

    @Column(name = "lower_bound")
    private Double lowerBound;

    @Column(name = "upper_bound")
    private Double upperBound;

    @Column(nullable = false)
    private Double confidence;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion;

    @Column(nullable = false, length = 50)
    private String status = "COMPLETED"; // COMPLETED, INSUFFICIENT_DATA

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public PatientForecast() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public Integer getHorizonMinutes() { return horizonMinutes; }
    public void setHorizonMinutes(Integer horizonMinutes) { this.horizonMinutes = horizonMinutes; }

    public Instant getForecastTimestamp() { return forecastTimestamp; }
    public void setForecastTimestamp(Instant forecastTimestamp) { this.forecastTimestamp = forecastTimestamp; }

    public String getMetric() { return metric; }
    public void setMetric(String metric) { this.metric = metric; }

    public Double getForecastValue() { return forecastValue; }
    public void setForecastValue(Double forecastValue) { this.forecastValue = forecastValue; }

    public Double getLowerBound() { return lowerBound; }
    public void setLowerBound(Double lowerBound) { this.lowerBound = lowerBound; }

    public Double getUpperBound() { return upperBound; }
    public void setUpperBound(Double upperBound) { this.upperBound = upperBound; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getModelName() { return modelName; }
    public void setModelName(String modelName) { this.modelName = modelName; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
