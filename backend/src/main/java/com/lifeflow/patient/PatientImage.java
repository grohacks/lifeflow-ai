package com.lifeflow.patient;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "patient_images")
public class PatientImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "image_id", nullable = false, unique = true, length = 100)
    private String imageId;

    @Column(name = "case_id", nullable = false, length = 100)
    private String caseId;

    @Column(nullable = false, length = 100)
    private String uploader;

    @Column(nullable = false, length = 255)
    private String filename;

    @Column(nullable = false, length = 100)
    private String checksum;

    @Column(name = "storage_path", nullable = false, length = 500)
    private String storagePath;

    @Column(name = "analysis_status", nullable = false, length = 50)
    private String analysisStatus = "PENDING"; // PENDING, ANALYZED, FAILED

    @Column(name = "possible_injury_region", length = 100)
    private String possibleInjuryRegion;

    @Column(name = "possible_visible_bleeding", length = 100)
    private String possibleVisibleBleeding;

    private Double confidence;

    @Column(name = "requires_human_confirmation", length = 150)
    private String requiresHumanConfirmation = "AI observation — requires human confirmation";

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public PatientImage() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getImageId() { return imageId; }
    public void setImageId(String imageId) { this.imageId = imageId; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getUploader() { return uploader; }
    public void setUploader(String uploader) { this.uploader = uploader; }

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getChecksum() { return checksum; }
    public void setChecksum(String checksum) { this.checksum = checksum; }

    public String getStoragePath() { return storagePath; }
    public void setStoragePath(String storagePath) { this.storagePath = storagePath; }

    public String getAnalysisStatus() { return analysisStatus; }
    public void setAnalysisStatus(String analysisStatus) { this.analysisStatus = analysisStatus; }

    public String getPossibleInjuryRegion() { return possibleInjuryRegion; }
    public void setPossibleInjuryRegion(String possibleInjuryRegion) { this.possibleInjuryRegion = possibleInjuryRegion; }

    public String getPossibleVisibleBleeding() { return possibleVisibleBleeding; }
    public void setPossibleVisibleBleeding(String possibleVisibleBleeding) { this.possibleVisibleBleeding = possibleVisibleBleeding; }

    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }

    public String getRequiresHumanConfirmation() { return requiresHumanConfirmation; }
    public void setRequiresHumanConfirmation(String requiresHumanConfirmation) { this.requiresHumanConfirmation = requiresHumanConfirmation; }

    public String getMetadataJson() { return metadataJson; }
    public void setMetadataJson(String metadataJson) { this.metadataJson = metadataJson; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
