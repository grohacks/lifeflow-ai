package com.lifeflow.decision;

import jakarta.persistence.*;

@Entity
@Table(name = "destination_evaluations")
public class DestinationEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_destination_id", nullable = false, unique = true)
    private CandidateDestination candidateDestination;

    @Column(name = "positive_factors_json", columnDefinition = "TEXT")
    private String positiveFactorsJson;

    @Column(name = "negative_factors_json", columnDefinition = "TEXT")
    private String negativeFactorsJson;

    @Column(name = "hard_constraints_json", columnDefinition = "TEXT")
    private String hardConstraintsJson;

    @Column(name = "uncertainty_factors_json", columnDefinition = "TEXT")
    private String uncertaintyFactorsJson;

    @Column(name = "patient_forecast_summary", columnDefinition = "TEXT")
    private String patientForecastSummary;

    @Column(name = "hospital_forecast_summary", columnDefinition = "TEXT")
    private String hospitalForecastSummary;

    @Column(name = "transport_summary", columnDefinition = "TEXT")
    private String transportSummary;

    public DestinationEvaluation() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CandidateDestination getCandidateDestination() { return candidateDestination; }
    public void setCandidateDestination(CandidateDestination candidateDestination) { this.candidateDestination = candidateDestination; }

    public String getPositiveFactorsJson() { return positiveFactorsJson; }
    public void setPositiveFactorsJson(String positiveFactorsJson) { this.positiveFactorsJson = positiveFactorsJson; }

    public String getNegativeFactorsJson() { return negativeFactorsJson; }
    public void setNegativeFactorsJson(String negativeFactorsJson) { this.negativeFactorsJson = negativeFactorsJson; }

    public String getHardConstraintsJson() { return hardConstraintsJson; }
    public void setHardConstraintsJson(String hardConstraintsJson) { this.hardConstraintsJson = hardConstraintsJson; }

    public String getUncertaintyFactorsJson() { return uncertaintyFactorsJson; }
    public void setUncertaintyFactorsJson(String uncertaintyFactorsJson) { this.uncertaintyFactorsJson = uncertaintyFactorsJson; }

    public String getPatientForecastSummary() { return patientForecastSummary; }
    public void setPatientForecastSummary(String patientForecastSummary) { this.patientForecastSummary = patientForecastSummary; }

    public String getHospitalForecastSummary() { return hospitalForecastSummary; }
    public void setHospitalForecastSummary(String hospitalForecastSummary) { this.hospitalForecastSummary = hospitalForecastSummary; }

    public String getTransportSummary() { return transportSummary; }
    public void setTransportSummary(String transportSummary) { this.transportSummary = transportSummary; }
}
