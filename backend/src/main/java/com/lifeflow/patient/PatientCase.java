package com.lifeflow.patient;

import com.lifeflow.ambulance.Ambulance;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "patient_cases")
public class PatientCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "case_id", nullable = false, unique = true, length = 100)
    private String caseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ambulance_id")
    private Ambulance ambulance;

    @Column(name = "patient_identifier", length = 100)
    private String patientIdentifier;

    private Integer age;

    @Column(length = 20)
    private String gender;

    @Column(name = "chief_complaint", length = 255)
    private String chiefComplaint;

    @Column(name = "triage_category", length = 50)
    private String triageCategory = "RED"; // RED (Immediate), YELLOW (Urgent), GREEN (Delayed), BLACK (Deceased)

    @Column(nullable = false, length = 50)
    private String status = "ACTIVE"; // ACTIVE, TRANSFERRED, RESOLVED, CANCELLED

    @Column(name = "started_at", nullable = false)
    private Instant startedAt = Instant.now();

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public PatientCase() {}

    public PatientCase(String caseId, Ambulance ambulance, String patientIdentifier, Integer age,
                       String gender, String chiefComplaint, String triageCategory) {
        this.caseId = caseId;
        this.ambulance = ambulance;
        this.patientIdentifier = patientIdentifier;
        this.age = age;
        this.gender = gender;
        this.chiefComplaint = chiefComplaint;
        this.triageCategory = triageCategory;
        this.status = "ACTIVE";
        this.startedAt = Instant.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public Ambulance getAmbulance() { return ambulance; }
    public void setAmbulance(Ambulance ambulance) { this.ambulance = ambulance; }

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

    public Instant getClosedAt() { return closedAt; }
    public void setClosedAt(Instant closedAt) { this.closedAt = closedAt; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
