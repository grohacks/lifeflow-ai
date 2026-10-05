package com.lifeflow.message;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class MessageService {

    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public MessageService(MessageRepository messageRepository, SimpMessagingTemplate messagingTemplate) {
        this.messageRepository = messageRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public List<Message> getMessagesForCase(String caseId) {
        return messageRepository.findByCaseIdOrderByTimestampAsc(caseId);
    }

    @Transactional
    public Message sendMessage(String caseId, String senderUser, String senderRole, String priority, String content, List<String> targetRoles) {
        String msgId = "MSG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        Message message = new Message(msgId, caseId, senderUser, senderRole, priority, content);

        if (targetRoles != null) {
            for (String role : targetRoles) {
                message.getRecipients().add(new MessageRecipient(message, role, null));
            }
        }

        Message saved = messageRepository.save(message);

        // Broadcast to WebSocket topic for real-time delivery
        messagingTemplate.convertAndSend("/topic/messages/" + caseId, saved);
        messagingTemplate.convertAndSend("/topic/messages/all", saved);

        return saved;
    }
}
