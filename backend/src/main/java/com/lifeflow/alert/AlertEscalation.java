package com.lifeflow.alert;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "alert_escalations")
public class AlertEscalation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "alert_id", nullable = false)
    @JsonIgnore
    private Alert alert;

    @Column(name = "escalation_level", nullable = false)
    private int escalationLevel;

    @Column(name = "escalated_to_role", nullable = false, length = 50)
    private String escalatedToRole;

    @Column(name = "escalation_reason", nullable = false)
    private String escalationReason;

    @Column(name = "escalated_at", nullable = false)
    private Instant escalatedAt = Instant.now();

    @Column(nullable = false)
    private boolean resolved = false;

    public AlertEscalation() {}

    public AlertEscalation(Alert alert, int escalationLevel, String escalatedToRole, String escalationReason) {
        this.alert = alert;
        this.escalationLevel = escalationLevel;
        this.escalatedToRole = escalatedToRole;
        this.escalationReason = escalationReason;
        this.escalatedAt = Instant.now();
        this.resolved = false;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Alert getAlert() { return alert; }
    public void setAlert(Alert alert) { this.alert = alert; }

    public int getEscalationLevel() { return escalationLevel; }
    public void setEscalationLevel(int escalationLevel) { this.escalationLevel = escalationLevel; }

    public String getEscalatedToRole() { return escalatedToRole; }
    public void setEscalatedToRole(String escalatedToRole) { this.escalatedToRole = escalatedToRole; }

    public String getEscalationReason() { return escalationReason; }
    public void setEscalationReason(String escalationReason) { this.escalationReason = escalationReason; }

    public Instant getEscatedAt() { return escalatedAt; }
    public void setEscalatedAt(Instant escalatedAt) { this.escalatedAt = escalatedAt; }

    public boolean isResolved() { return resolved; }
    public void setResolved(boolean resolved) { this.resolved = resolved; }
}
