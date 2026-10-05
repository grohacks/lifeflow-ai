package com.lifeflow.prealert;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public class PreAlertDtos {

    public static class RecordDecisionRequest {
        @NotBlank(message = "Case ID is required")
        private String caseId;
        private Long recommendationId;
        @NotNull(message = "Selected Hospital ID is required")
        private Long selectedHospitalId;
        @NotBlank(message = "Decision Type (ACCEPT, SELECT_ANOTHER, OVERRIDE) is required")
        private String decisionType;
        private String reason;

        public RecordDecisionRequest() {}

        public String getCaseId() { return caseId; }
        public void setCaseId(String caseId) { this.caseId = caseId; }

        public Long getRecommendationId() { return recommendationId; }
        public void setRecommendationId(Long recommendationId) { this.recommendationId = recommendationId; }

        public Long getSelectedHospitalId() { return selectedHospitalId; }
        public void setSelectedHospitalId(Long selectedHospitalId) { this.selectedHospitalId = selectedHospitalId; }

        public String getDecisionType() { return decisionType; }
        public void setDecisionType(String decisionType) { this.decisionType = decisionType; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class HumanDecisionDto {
        private String decisionId;
        private String caseId;
        private Long selectedHospitalId;
        private String selectedHospitalName;
        private String decisionType;
        private String userName;
        private Instant timestamp;
        private String reason;

        public HumanDecisionDto() {}

        public String getDecisionId() { return decisionId; }
        public void setDecisionId(String decisionId) { this.decisionId = decisionId; }

        public String getCaseId() { return caseId; }
        public void setCaseId(String caseId) { this.caseId = caseId; }

        public Long getSelectedHospitalId() { return selectedHospitalId; }
        public void setSelectedHospitalId(Long selectedHospitalId) { this.selectedHospitalId = selectedHospitalId; }

        public String getSelectedHospitalName() { return selectedHospitalName; }
        public void setSelectedHospitalName(String selectedHospitalName) { this.selectedHospitalName = selectedHospitalName; }

        public String getDecisionType() { return decisionType; }
        public void setDecisionType(String decisionType) { this.decisionType = decisionType; }

        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }

        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class PreAlertDto {
        private Long id;
        private String prealertId;
        private String caseId;
        private Long ambulanceId;
        private String vehicleNumber;
        private Long hospitalId;
        private String hospitalName;
        private Integer etaSeconds;
        private Integer etaMinutes;
        private String patientSummary;
        private String relevantObservations;
        private String interventionsPerformed;
        private String requestedCapabilities;
        private String status;
        private Instant sentAt;
        private Instant acknowledgedAt;
        private String acknowledgedBy;

        private String reservedBeds;
        private Integer reservedBloodUnits;
        private String reservedEquipment;
        private String assignedDoctorName;
        private Boolean doctorNotified;
        private Instant doctorNotifiedAt;
        private String doctorOrders;
        private Double incidentLatitude;
        private Double incidentLongitude;
        private Double hospitalLatitude;
        private Double hospitalLongitude;

        public PreAlertDto() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getPrealertId() { return prealertId; }
        public void setPrealertId(String prealertId) { this.prealertId = prealertId; }

        public String getCaseId() { return caseId; }
        public void setCaseId(String caseId) { this.caseId = caseId; }

        public Long getAmbulanceId() { return ambulanceId; }
        public void setAmbulanceId(Long ambulanceId) { this.ambulanceId = ambulanceId; }

        public String getVehicleNumber() { return vehicleNumber; }
        public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

        public Long getHospitalId() { return hospitalId; }
        public void setHospitalId(Long hospitalId) { this.hospitalId = hospitalId; }

        public String getHospitalName() { return hospitalName; }
        public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

        public Integer getEtaSeconds() { return etaSeconds; }
        public void setEtaSeconds(Integer etaSeconds) {
            this.etaSeconds = etaSeconds;
            this.etaMinutes = (int) Math.round(etaSeconds / 60.0);
        }

        public Integer getEtaMinutes() { return etaMinutes; }
        public void setEtaMinutes(Integer etaMinutes) { this.etaMinutes = etaMinutes; }

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

        public Double getIncidentLatitude() { return incidentLatitude; }
        public void setIncidentLatitude(Double incidentLatitude) { this.incidentLatitude = incidentLatitude; }

        public Double getIncidentLongitude() { return incidentLongitude; }
        public void setIncidentLongitude(Double incidentLongitude) { this.incidentLongitude = incidentLongitude; }

        public Double getHospitalLatitude() { return hospitalLatitude; }
        public void setHospitalLatitude(Double hospitalLatitude) { this.hospitalLatitude = hospitalLatitude; }

        public Double getHospitalLongitude() { return hospitalLongitude; }
        public void setHospitalLongitude(Double hospitalLongitude) { this.hospitalLongitude = hospitalLongitude; }
    }

    public static class ReserveResourcesRequest {
        private String reservedBeds;
        private Integer reservedBloodUnits;
        private String reservedEquipment;

        public ReserveResourcesRequest() {}

        public String getReservedBeds() { return reservedBeds; }
        public void setReservedBeds(String reservedBeds) { this.reservedBeds = reservedBeds; }

        public Integer getReservedBloodUnits() { return reservedBloodUnits; }
        public void setReservedBloodUnits(Integer reservedBloodUnits) { this.reservedBloodUnits = reservedBloodUnits; }

        public String getReservedEquipment() { return reservedEquipment; }
        public void setReservedEquipment(String reservedEquipment) { this.reservedEquipment = reservedEquipment; }
    }

    public static class NotifyDoctorRequest {
        private String doctorName;
        private String department;
        private String note;

        public NotifyDoctorRequest() {}

        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }

        public String getNote() { return note; }
        public void setNote(String note) { this.note = note; }
    }

    public static class DoctorOrdersRequest {
        private String doctorName;
        private String doctorOrders;

        public DoctorOrdersRequest() {}

        public String getDoctorName() { return doctorName; }
        public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

        public String getDoctorOrders() { return doctorOrders; }
        public void setDoctorOrders(String doctorOrders) { this.doctorOrders = doctorOrders; }
    }
}
