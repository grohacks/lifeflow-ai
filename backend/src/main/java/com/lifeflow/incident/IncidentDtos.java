package com.lifeflow.incident;

import java.time.Instant;

public class IncidentDtos {

    public static class SosReportRequest {
        private String bystanderName;
        private String bystanderPhone;
        private String incidentType; // ROAD_ACCIDENT, CARDIAC_ARREST, FALL_TRAUMA, BURNS, OTHER
        private String severity; // CRITICAL, HIGH, MEDIUM
        private Integer casualtyCount;
        private String description;
        private Double latitude;
        private Double longitude;
        private String locationAddress;
        private String photoUrl;

        public SosReportRequest() {}

        public String getBystanderName() { return bystanderName; }
        public void setBystanderName(String bystanderName) { this.bystanderName = bystanderName; }

        public String getBystanderPhone() { return bystanderPhone; }
        public void setBystanderPhone(String bystanderPhone) { this.bystanderPhone = bystanderPhone; }

        public String getIncidentType() { return incidentType; }
        public void setIncidentType(String incidentType) { this.incidentType = incidentType; }

        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }

        public Integer getCasualtyCount() { return casualtyCount; }
        public void setCasualtyCount(Integer casualtyCount) { this.casualtyCount = casualtyCount; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }

        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }

        public String getLocationAddress() { return locationAddress; }
        public void setLocationAddress(String locationAddress) { this.locationAddress = locationAddress; }

        public String getPhotoUrl() { return photoUrl; }
        public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }
    }

    public static class IncidentDto {
        private Long id;
        private String incidentCode;
        private String bystanderName;
        private String bystanderPhone;
        private String incidentType;
        private String severity;
        private Integer casualtyCount;
        private String description;
        private Double latitude;
        private Double longitude;
        private String locationAddress;
        private String photoUrl;
        private Long assignedAmbulanceId;
        private String ambulanceCallSign;
        private Double distanceKm;
        private Integer etaMinutes;
        private String status;
        private Instant reportedAt;
        private String patientCaseId;

        public IncidentDto() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getIncidentCode() { return incidentCode; }
        public void setIncidentCode(String incidentCode) { this.incidentCode = incidentCode; }

        public String getBystanderName() { return bystanderName; }
        public void setBystanderName(String bystanderName) { this.bystanderName = bystanderName; }

        public String getBystanderPhone() { return bystanderPhone; }
        public void setBystanderPhone(String bystanderPhone) { this.bystanderPhone = bystanderPhone; }

        public String getIncidentType() { return incidentType; }
        public void setIncidentType(String incidentType) { this.incidentType = incidentType; }

        public String getSeverity() { return severity; }
        public void setSeverity(String severity) { this.severity = severity; }

        public Integer getCasualtyCount() { return casualtyCount; }
        public void setCasualtyCount(Integer casualtyCount) { this.casualtyCount = casualtyCount; }

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }

        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }

        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }

        public String getLocationAddress() { return locationAddress; }
        public void setLocationAddress(String locationAddress) { this.locationAddress = locationAddress; }

        public String getPhotoUrl() { return photoUrl; }
        public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

        public Long getAssignedAmbulanceId() { return assignedAmbulanceId; }
        public void setAssignedAmbulanceId(Long assignedAmbulanceId) { this.assignedAmbulanceId = assignedAmbulanceId; }

        public String getAmbulanceCallSign() { return ambulanceCallSign; }
        public void setAmbulanceCallSign(String ambulanceCallSign) { this.ambulanceCallSign = ambulanceCallSign; }

        public Double getDistanceKm() { return distanceKm; }
        public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

        public Integer getEtaMinutes() { return etaMinutes; }
        public void setEtaMinutes(Integer etaMinutes) { this.etaMinutes = etaMinutes; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public Instant getReportedAt() { return reportedAt; }
        public void setReportedAt(Instant reportedAt) { this.reportedAt = reportedAt; }

        public String getPatientCaseId() { return patientCaseId; }
        public void setPatientCaseId(String patientCaseId) { this.patientCaseId = patientCaseId; }
    }

    public static class SmsWebhookRequest {
        private String from;
        private String body;
        private String text;
        private String message;
        private Double latitude;
        private Double longitude;

        public SmsWebhookRequest() {}

        public String getFrom() { return from; }
        public void setFrom(String from) { this.from = from; }

        public String getBody() { return body != null ? body : (text != null ? text : message); }
        public void setBody(String body) { this.body = body; }

        public String getText() { return text; }
        public void setText(String text) { this.text = text; }

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }

        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }
    }

    public static class CallWebhookRequest {
        private String callerPhone;
        private String transcript;
        private String speechResult;
        private Double latitude;
        private Double longitude;
        private String callerLocation;

        public CallWebhookRequest() {}

        public String getCallerPhone() { return callerPhone; }
        public void setCallerPhone(String callerPhone) { this.callerPhone = callerPhone; }

        public String getTranscript() { return transcript != null ? transcript : speechResult; }
        public void setTranscript(String transcript) { this.transcript = transcript; }

        public String getSpeechResult() { return speechResult; }
        public void setSpeechResult(String speechResult) { this.speechResult = speechResult; }

        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }

        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }

        public String getCallerLocation() { return callerLocation; }
        public void setCallerLocation(String callerLocation) { this.callerLocation = callerLocation; }
    }
}
