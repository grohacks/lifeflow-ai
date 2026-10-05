package com.lifeflow.hospital;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "hospital_twin_states")
public class HospitalTwinState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    @Column(name = "icu_occupancy_pct")
    private Double icuOccupancyPct;

    @Column(name = "ed_occupancy_pct")
    private Double edOccupancyPct;

    @Column(name = "ot_available_count")
    private Integer otAvailableCount;

    @Column(name = "ventilator_available_count")
    private Integer ventilatorAvailableCount;

    @Column(name = "ct_scanner_available")
    private Boolean ctScannerAvailable;

    @Column(name = "mri_scanner_available")
    private Boolean mriScannerAvailable;

    @Column(name = "specialist_available")
    private Boolean specialistAvailable;

    @Column(name = "trauma_ready")
    private Boolean traumaReady;

    @Column(name = "overall_freshness_status", nullable = false, length = 30)
    private String overallFreshnessStatus = "CURRENT"; // CURRENT, STALE, EXPIRED

    @Column(name = "confidence_score", nullable = false)
    private Double confidenceScore = 1.0;

    @Column(name = "correlation_id", nullable = false, length = 100)
    private String correlationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public HospitalTwinState() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Double getIcuOccupancyPct() { return icuOccupancyPct; }
    public void setIcuOccupancyPct(Double icuOccupancyPct) { this.icuOccupancyPct = icuOccupancyPct; }

    public Double getEdOccupancyPct() { return edOccupancyPct; }
    public void setEdOccupancyPct(Double edOccupancyPct) { this.edOccupancyPct = edOccupancyPct; }

    public Integer getOtAvailableCount() { return otAvailableCount; }
    public void setOtAvailableCount(Integer otAvailableCount) { this.otAvailableCount = otAvailableCount; }

    public Integer getVentilatorAvailableCount() { return ventilatorAvailableCount; }
    public void setVentilatorAvailableCount(Integer ventilatorAvailableCount) { this.ventilatorAvailableCount = ventilatorAvailableCount; }

    public Boolean getCtScannerAvailable() { return ctScannerAvailable; }
    public void setCtScannerAvailable(Boolean ctScannerAvailable) { this.ctScannerAvailable = ctScannerAvailable; }

    public Boolean getMriScannerAvailable() { return mriScannerAvailable; }
    public void setMriScannerAvailable(Boolean mriScannerAvailable) { this.mriScannerAvailable = mriScannerAvailable; }

    public Boolean getSpecialistAvailable() { return specialistAvailable; }
    public void setSpecialistAvailable(Boolean specialistAvailable) { this.specialistAvailable = specialistAvailable; }

    public Boolean getTraumaReady() { return traumaReady; }
    public void setTraumaReady(Boolean traumaReady) { this.traumaReady = traumaReady; }

    public String getOverallFreshnessStatus() { return overallFreshnessStatus; }
    public void setOverallFreshnessStatus(String overallFreshnessStatus) { this.overallFreshnessStatus = overallFreshnessStatus; }

    public Double getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
