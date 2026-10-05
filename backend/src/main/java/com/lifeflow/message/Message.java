package com.lifeflow.message;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "messages")
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "message_id", nullable = false, unique = true, length = 100)
    private String messageId;

    @Column(name = "case_id", nullable = false, length = 100)
    private String caseId;

    @Column(name = "sender_user", nullable = false, length = 100)
    private String senderUser;

    @Column(name = "sender_role", nullable = false, length = 50)
    private String senderRole;

    @Column(nullable = false, length = 30)
    private String priority = "ROUTINE"; // ROUTINE, URGENT, EMERGENCY

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "attachment_type", length = 50)
    private String attachmentType;

    @Column(name = "attachment_ref", length = 255)
    private String attachmentRef;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private Set<MessageRecipient> recipients = new HashSet<>();

    public Message() {}

    public Message(String messageId, String caseId, String senderUser, String senderRole, String priority, String content) {
        this.messageId = messageId;
        this.caseId = caseId;
        this.senderUser = senderUser;
        this.senderRole = senderRole;
        this.priority = priority;
        this.content = content;
        this.timestamp = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMessageId() { return messageId; }
    public void setMessageId(String messageId) { this.messageId = messageId; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getSenderUser() { return senderUser; }
    public void setSenderUser(String senderUser) { this.senderUser = senderUser; }

    public String getSenderRole() { return senderRole; }
    public void setSenderRole(String senderRole) { this.senderRole = senderRole; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getAttachmentType() { return attachmentType; }
    public void setAttachmentType(String attachmentType) { this.attachmentType = attachmentType; }

    public String getAttachmentRef() { return attachmentRef; }
    public void setAttachmentRef(String attachmentRef) { this.attachmentRef = attachmentRef; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Set<MessageRecipient> getRecipients() { return recipients; }
    public void setRecipients(Set<MessageRecipient> recipients) { this.recipients = recipients; }
}
