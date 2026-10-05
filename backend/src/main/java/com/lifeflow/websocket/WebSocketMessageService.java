package com.lifeflow.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class WebSocketMessageService {

    private static final Logger log = LoggerFactory.getLogger(WebSocketMessageService.class);

    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketMessageService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastTelemetry(Long ambulanceId, Object telemetryData) {
        String destination = "/topic/telemetry/" + (ambulanceId != null ? ambulanceId : "all");
        messagingTemplate.convertAndSend(destination, telemetryData);
    }

    public void broadcastPatientTwinUpdate(String caseId, Object twinDto) {
        messagingTemplate.convertAndSend("/topic/patient-twin/" + caseId, twinDto);
        messagingTemplate.convertAndSend("/topic/patients/" + caseId + "/twin", twinDto);
        // Also broadcast to global active case channel
        messagingTemplate.convertAndSend("/topic/patient-twin/all", twinDto);
    }

    public void broadcastAmbulanceMovement(Long ambulanceId, Object stateDto) {
        String destination = "/topic/transport/" + ambulanceId;
        messagingTemplate.convertAndSend(destination, stateDto);
        messagingTemplate.convertAndSend("/topic/transport/all", stateDto);
    }

    public void broadcastTrafficChange(Long ambulanceId, double trafficMultiplier) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("ambulanceId", ambulanceId);
        payload.put("trafficMultiplier", trafficMultiplier);
        messagingTemplate.convertAndSend("/topic/traffic", payload);
    }

    public void broadcastHospitalResourceChange(String hospitalCode, String resourceType, int count) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("hospitalCode", hospitalCode);
        payload.put("resourceType", resourceType);
        payload.put("availableCount", count);
        messagingTemplate.convertAndSend("/topic/hospital-resources", payload);
    }

    public void broadcastRecommendation(String caseId, Object recommendationDto) {
        String destination = "/topic/recommendations/" + caseId;
        messagingTemplate.convertAndSend(destination, recommendationDto);
        messagingTemplate.convertAndSend("/topic/recommendations/all", recommendationDto);
    }

    public void broadcastPreAlert(Long hospitalId, Object preAlertDto) {
        broadcastPreAlert(hospitalId, null, preAlertDto);
    }

    public void broadcastPreAlert(Long hospitalId, String caseId, Object preAlertDto) {
        if (hospitalId != null) {
            messagingTemplate.convertAndSend("/topic/prealerts/" + hospitalId, preAlertDto);
        }
        if (caseId != null) {
            messagingTemplate.convertAndSend("/topic/prealerts/case/" + caseId, preAlertDto);
        }
        messagingTemplate.convertAndSend("/topic/prealerts/all", preAlertDto);
    }

    public void broadcastSimulationStatus(Object statusDto) {
        messagingTemplate.convertAndSend("/topic/simulation", statusDto);
    }

    public void broadcastIncidentAlert(Object incidentDto) {
        messagingTemplate.convertAndSend("/topic/incidents", incidentDto);
        messagingTemplate.convertAndSend("/topic/alerts", incidentDto);
    }

    public void broadcastCameraSnap(String caseId, Object snapData) {
        messagingTemplate.convertAndSend("/topic/camera-stream/" + caseId, snapData);
        messagingTemplate.convertAndSend("/topic/camera-snaps/" + caseId, snapData);
    }
}
