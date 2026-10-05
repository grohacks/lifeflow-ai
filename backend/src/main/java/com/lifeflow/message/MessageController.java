package com.lifeflow.message;

import com.lifeflow.common.ApiResponse;
import com.lifeflow.common.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cases/{caseId}/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Message>>> getMessages(
            @PathVariable String caseId,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<Message> messages = messageService.getMessagesForCase(caseId);
        return ResponseEntity.ok(ApiResponse.ok(messages, correlationId));
    }

    public static class SendMessageRequest {
        public String senderUser;
        public String senderRole;
        public String priority;
        public String content;
        public List<String> targetRoles;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Message>> sendMessage(
            @PathVariable String caseId,
            @RequestBody SendMessageRequest req,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        Message message = messageService.sendMessage(
                caseId,
                req.senderUser != null ? req.senderUser : "Field Staff",
                req.senderRole != null ? req.senderRole : "ROLE_PARAMEDIC",
                req.priority != null ? req.priority : "ROUTINE",
                req.content,
                req.targetRoles
        );
        return ResponseEntity.ok(ApiResponse.ok("Message sent", message, correlationId));
    }
}
