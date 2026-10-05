package com.lifeflow.hospital;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "hospital_resource_snapshots")
public class HospitalResourceSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @Column(name = "snapshot_time", nullable = false)
    private Instant snapshotTime = Instant.now();

    @Column(name = "resources_json", nullable = false, columnDefinition = "TEXT")
    private String resourcesJson;

    @Column(name = "correlation_id", length = 100)
    private String correlationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public HospitalResourceSnapshot() {}

    public HospitalResourceSnapshot(Hospital hospital, String resourcesJson, String correlationId) {
        this.hospital = hospital;
        this.resourcesJson = resourcesJson;
        this.correlationId = correlationId;
        this.snapshotTime = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }

    public Instant getSnapshotTime() { return snapshotTime; }
    public void setSnapshotTime(Instant snapshotTime) { this.snapshotTime = snapshotTime; }

    public String getResourcesJson() { return resourcesJson; }
    public void setResourcesJson(String resourcesJson) { this.resourcesJson = resourcesJson; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
