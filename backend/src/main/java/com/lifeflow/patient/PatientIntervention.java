package com.lifeflow.patient;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "patient_interventions")
public class PatientIntervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "intervention_id", nullable = false, unique = true, length = 100)
    private String interventionId;

    @Column(name = "case_id", nullable = false, length = 100)
    private String caseId;

    @Column(name = "performed_by", nullable = false, length = 100)
    private String performedBy;

    @Column(name = "intervention_type", nullable = false, length = 100)
    private String interventionType; // OXYGEN_THERAPY, INTUBATION, CPR, DEFIBRILLATION, MEDICATION, IV_ACCESS, IMMOBILIZATION, WOUND_PACKING

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(length = 100)
    private String dose;

    @Column(length = 50)
    private String route;

    @Column(nullable = false)
    private Instant timestamp;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public PatientIntervention() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getInterventionId() { return interventionId; }
    public void setInterventionId(String interventionId) { this.interventionId = interventionId; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getPerformedBy() { return performedBy; }
    public void setPerformedBy(String performedBy) { this.performedBy = performedBy; }

    public String getInterventionType() { return interventionType; }
    public void setInterventionType(String interventionType) { this.interventionType = interventionType; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getDose() { return dose; }
    public void setDose(String dose) { this.dose = dose; }

    public String getRoute() { return route; }
    public void setRoute(String route) { this.route = route; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
