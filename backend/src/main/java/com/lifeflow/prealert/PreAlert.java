package com.lifeflow.prealert;

import com.lifeflow.ambulance.Ambulance;
import com.lifeflow.hospital.Hospital;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "prealerts")
public class PreAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "prealert_id", nullable = false, unique = true, length = 100)
    private String prealertId;

    @Column(name = "case_id", nullable = false, length = 100)
    private String caseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ambulance_id", nullable = false)
    private Ambulance ambulance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hospital_id", nullable = false)
    private Hospital hospital;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "human_decision_id")
    private HumanDecision humanDecision;

    @Column(name = "eta_seconds", nullable = false)
    private Integer etaSeconds;

    @Column(name = "patient_summary", nullable = false, columnDefinition = "TEXT")
    private String patientSummary;

    @Column(name = "relevant_observations", columnDefinition = "TEXT")
    private String relevantObservations;

    @Column(name = "interventions_performed", columnDefinition = "TEXT")
    private String interventionsPerformed;

    @Column(name = "requested_capabilities", columnDefinition = "TEXT")
    private String requestedCapabilities;

    @Column(nullable = false, length = 50)
    private String status = "PENDING_ACK"; // PENDING_ACK, ACKNOWLEDGED, CANCELLED

    @Column(name = "sent_at", nullable = false)
    private Instant sentAt = Instant.now();

    @Column(name = "acknowledged_at")
    private Instant acknowledgedAt;

    @Column(name = "acknowledged_by", length = 100)
    private String acknowledgedBy;

    @Column(name = "reserved_beds", length = 200)
    private String reservedBeds;

    @Column(name = "reserved_blood_units")
    private Integer reservedBloodUnits;

    @Column(name = "reserved_equipment", length = 200)
    private String reservedEquipment;

    @Column(name = "assigned_doctor_name", length = 150)
    private String assignedDoctorName;

    @Column(name = "doctor_notified")
    private Boolean doctorNotified = false;

    @Column(name = "doctor_notified_at")
    private Instant doctorNotifiedAt;

    @Column(name = "doctor_orders", columnDefinition = "TEXT")
    private String doctorOrders;

    @Column(name = "correlation_id", nullable = false, length = 100)
    private String correlationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public PreAlert() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPrealertId() { return prealertId; }
    public void setPrealertId(String prealertId) { this.prealertId = prealertId; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public Ambulance getAmbulance() { return ambulance; }
    public void setAmbulance(Ambulance ambulance) { this.ambulance = ambulance; }

    public Hospital getHospital() { return hospital; }
    public void setHospital(Hospital hospital) { this.hospital = hospital; }

    public HumanDecision getHumanDecision() { return humanDecision; }
    public void setHumanDecision(HumanDecision humanDecision) { this.humanDecision = humanDecision; }

    public Integer getEtaSeconds() { return etaSeconds; }
    public void setEtaSeconds(Integer etaSeconds) { this.etaSeconds = etaSeconds; }

    public String getPatientSummary() { return patientSummary; }
    public void setPatientSummary(String patientSummary) { this.patientSummary = patientSummary; }

    public String getRelevantObservations() { return relevantObservations; }
    public void setRelevantObservations(String relevantObservations) { this.relevantObservations = relevantObservations; }

    public String getInterventionsPerformed() { return interventionsPerformed; }
    public void setInterventionsPerformed(String interventionsPerformed) { this.interventionsPerformed = interventionsPerformed; }

    public String getRequestedCapabilities() { return requestedCapabilities; }
    public void setRequestedCapabilities(String requestedCapabilities) { this.requestedCapabilities = requestedCapabilities; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }

    public Instant getAcknowledgedAt() { return acknowledgedAt; }
    public void setAcknowledgedAt(Instant acknowledgedAt) { this.acknowledgedAt = acknowledgedAt; }

    public String getAcknowledgedBy() { return acknowledgedBy; }
    public void setAcknowledgedBy(String acknowledgedBy) { this.acknowledgedBy = acknowledgedBy; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public String getReservedBeds() { return reservedBeds; }
    public void setReservedBeds(String reservedBeds) { this.reservedBeds = reservedBeds; }

    public Integer getReservedBloodUnits() { return reservedBloodUnits; }
    public void setReservedBloodUnits(Integer reservedBloodUnits) { this.reservedBloodUnits = reservedBloodUnits; }

    public String getReservedEquipment() { return reservedEquipment; }
    public void setReservedEquipment(String reservedEquipment) { this.reservedEquipment = reservedEquipment; }

    public String getAssignedDoctorName() { return assignedDoctorName; }
    public void setAssignedDoctorName(String assignedDoctorName) { this.assignedDoctorName = assignedDoctorName; }

    public Boolean getDoctorNotified() { return doctorNotified; }
    public void setDoctorNotified(Boolean doctorNotified) { this.doctorNotified = doctorNotified; }

    public Instant getDoctorNotifiedAt() { return doctorNotifiedAt; }
    public void setDoctorNotifiedAt(Instant doctorNotifiedAt) { this.doctorNotifiedAt = doctorNotifiedAt; }

    public String getDoctorOrders() { return doctorOrders; }
    public void setDoctorOrders(String doctorOrders) { this.doctorOrders = doctorOrders; }
}
