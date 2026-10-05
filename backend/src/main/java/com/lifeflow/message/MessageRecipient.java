package com.lifeflow.message;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "message_recipients")
public class MessageRecipient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id", nullable = false)
    @JsonIgnore
    private Message message;

    @Column(name = "recipient_role", nullable = false, length = 50)
    private String recipientRole;

    @Column(name = "recipient_user", length = 100)
    private String recipientUser;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(name = "read_at")
    private Instant readAt;

    public MessageRecipient() {}

    public MessageRecipient(Message message, String recipientRole, String recipientUser) {
        this.message = message;
        this.recipientRole = recipientRole;
        this.recipientUser = recipientUser;
        this.read = false;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Message getMessage() { return message; }
    public void setMessage(Message message) { this.message = message; }

    public String getRecipientRole() { return recipientRole; }
    public void setRecipientRole(String recipientRole) { this.recipientRole = recipientRole; }

    public String getRecipientUser() { return recipientUser; }
    public void setRecipientUser(String recipientUser) { this.recipientUser = recipientUser; }

    public boolean isRead() { return read; }
    public void setRead(boolean read) { this.read = read; }

    public Instant getReadAt() { return readAt; }
    public void setReadAt(Instant readAt) { this.readAt = readAt; }
}
