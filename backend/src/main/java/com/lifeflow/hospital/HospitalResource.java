package com.lifeflow.hospital;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "hospital_resources")
public class HospitalResource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @Column(name = "resource_type", nullable = false, length = 50)
    private String resourceType; // ICU_BEDS, ED_BEDS, OT_THEATRES, VENTILATORS, CT_SCANNERS, MRI_SCANNERS, BLOOD_BANK_UNITS, CARDIOLOGIST, NEUROLOGIST, TRAUMA_SURGEON

    @Column(name = "total_capacity", nullable = false)
    private Integer totalCapacity;

    @Column(name = "available_count", nullable = false)
    private Integer availableCount;

    @Column(nullable = false, length = 30)
    private String status = "AVAILABLE"; // AVAILABLE, STALE, UNAVAILABLE, CRITICAL

    @Column(nullable = false)
    private Double confidence = 1.0;

    @Column(name = "freshness_ttl_seconds", nullable = false)
    private Integer freshnessTtlSeconds = 300; // 5 minutes

    @Column(name = "last_updated_at", nullable = false)
    private Instant lastUpdatedAt = Instant.now();

    @Column(nullable = false, length = 100)
    private String source = "HOSPITAL_EHR_INTERFACE";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public HospitalResource() {}

    public HospitalResource(Hospital hospital, String resourceType, Integer totalCapacity, Integer availableCount, Integer ttl) {
        this.hospital = hospital;
        this.resourceType = resourceType;
        this.totalCapacity = totalCapacity;
        this.availableCount = availableCount;
        this.freshnessTtlSeconds = ttl != null ? ttl : 300;
        this.status = availableCount > 0 ? "AVAILABLE" : "UNAVAILABLE";
        this.confidence = 1.0;
        this.lastUpdatedAt = Instant.now();
        this.source = "HOSPITAL_EHR_INTERFACE";
    }

    public boolean isStale() {
        return Instant.now().isAfter(lastUpdatedAt.plusSeconds(freshnessTtlSeconds));
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }

    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }

    public Integer getTotalCapacity() { return totalCapacity; }
    public void setTotalCapacity(Integer totalCapacity) { this.totalCapacity = totalCapacity; }

    public Integer getAvailableCount() { return availableCount; }
    public void setAvailableCount(Integer availableCount) {
        this.availableCount = availableCount;
        this.status = availableCount > 0 ? "AVAILABLE" : "UNAVAILABLE";
        this.lastUpdatedAt = Instant.now();
    }

    public String getStatus() {
        if (isStale()) return "STALE";
        return status;
    }
    public void setStatus(String status) { this.status = status; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public Integer getFreshnessTtlSeconds() { return freshnessTtlSeconds; }
    public void setFreshnessTtlSeconds(Integer freshnessTtlSeconds) { this.freshnessTtlSeconds = freshnessTtlSeconds; }

    public Instant getLastUpdatedAt() { return lastUpdatedAt; }
    public void setLastUpdatedAt(Instant lastUpdatedAt) { this.lastUpdatedAt = lastUpdatedAt; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
