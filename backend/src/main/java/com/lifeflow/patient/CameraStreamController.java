package com.lifeflow.patient;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class CameraStreamController {

    private static final Logger log = LoggerFactory.getLogger(CameraStreamController.class);

    private final SimpMessagingTemplate messagingTemplate;

    public CameraStreamController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Relays live video frames sent from mobile phone to all subscribers of the patient case stream.
     */
    @MessageMapping("/camera-stream/{caseId}")
    public void handleCameraFrame(@DestinationVariable String caseId, @Payload Map<String, Object> payload) {
        // Broadcast immediately to subscribers on /topic/camera-stream/{caseId}
        messagingTemplate.convertAndSend("/topic/camera-stream/" + caseId, payload);
    }
}
