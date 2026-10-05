package com.lifeflow.patient;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "patient_observations")
public class PatientObservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "observation_id", nullable = false, unique = true, length = 100)
    private String observationId;

    @Column(name = "case_id", nullable = false, length = 100)
    private String caseId;

    @Column(name = "recorded_by", nullable = false, length = 100)
    private String recordedBy;

    @Column(length = 50)
    private String consciousness; // ALERT, VERBAL, PAIN, UNRESPONSIVE

    @Column(length = 50)
    private String airway; // CLEAR, OBSTRUCTED, MAINTAINED

    @Column(length = 50)
    private String breathing; // NORMAL, SHALLOW, LABORED, AGONAL, APNEIC

    @Column(length = 50)
    private String circulation; // STRONG, WEAK, ABSENT, IRREGULAR

    @Column(length = 255)
    private String injury;

    @Column(length = 100)
    private String bleeding; // NONE, MINOR, CONTROLLED, SEVERE_ACTIVE

    @Column(name = "pain_score")
    private Integer painScore; // 0 to 10

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public PatientObservation() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getObservationId() { return observationId; }
    public void setObservationId(String observationId) { this.observationId = observationId; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getRecordedBy() { return recordedBy; }
    public void setRecordedBy(String recordedBy) { this.recordedBy = recordedBy; }

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

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
