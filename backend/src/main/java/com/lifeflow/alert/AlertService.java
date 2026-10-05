package com.lifeflow.alert;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AlertService {

    private static final Logger log = LoggerFactory.getLogger(AlertService.class);

    private final AlertRepository alertRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public AlertService(AlertRepository alertRepository, SimpMessagingTemplate messagingTemplate) {
        this.alertRepository = alertRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public List<Alert> getAllAlerts() {
        return alertRepository.findAllByOrderByTimestampDesc();
    }

    @Transactional(readOnly = true)
    public List<Alert> getActiveAlerts() {
        return alertRepository.findByStatusOrderByTimestampDesc("ACTIVE");
    }

    @Transactional
    public Alert triggerAlert(String caseId, String alertType, String severity, String message, String source) {
        String alertId = "ALT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Alert alert = new Alert(alertId, caseId, alertType, severity, message, source);
        Alert saved = alertRepository.save(alert);

        log.warn("TRIGGERED ALERT: [{}] {} - {}", severity, alertType, message);

        // Broadcast to WebSocket clients
        messagingTemplate.convertAndSend("/topic/alerts", saved);
        if (caseId != null) {
            messagingTemplate.convertAndSend("/topic/alerts/" + caseId, saved);
        }

        return saved;
    }

    @Transactional
    public Alert acknowledgeAlert(String alertId, String acknowledgedBy) {
        Alert alert = alertRepository.findByAlertId(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));

        alert.setAcknowledged(true);
        alert.setStatus("ACKNOWLEDGED");
        alert.setAcknowledgedBy(acknowledgedBy);
        alert.setAcknowledgedAt(Instant.now());

        Alert saved = alertRepository.save(alert);
        messagingTemplate.convertAndSend("/topic/alerts", saved);
        return saved;
    }

    @Transactional
    public Alert escalateAlert(String alertId, int level, String escalatedToRole, String reason) {
        Alert alert = alertRepository.findByAlertId(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));

        alert.setStatus("ESCALATED");
        alert.getEscalations().add(new AlertEscalation(alert, level, escalatedToRole, reason));

        Alert saved = alertRepository.save(alert);
        log.warn("ALERT ESCALATED to level {}: {} to role {}", level, alertId, escalatedToRole);
        messagingTemplate.convertAndSend("/topic/alerts", saved);
        return saved;
    }
}
