package com.lifeflow.agent;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "agent_runs")
public class AgentRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_id", nullable = false, unique = true, length = 100)
    private String runId;

    @Column(name = "agent_id", nullable = false, length = 50)
    private String agentId;

    @Column(name = "agent_name", nullable = false, length = 100)
    private String agentName;

    @Column(name = "trigger_type", nullable = false, length = 50)
    private String triggerType; // TELEMETRY_INGRESS, DETERIORATION_EVENT, REASSESSMENT_TICK, MANUAL_PROMPT

    @Column(name = "case_id", length = 100)
    private String caseId;

    @Column(nullable = false, length = 100)
    private String model = "local-deterministic";

    @Column(name = "model_version", nullable = false, length = 50)
    private String modelVersion = "1.0.0";

    @Column(name = "input_snapshot_json", columnDefinition = "LONGTEXT")
    private String inputSnapshotJson;

    @Column(name = "structured_output_json", columnDefinition = "LONGTEXT")
    private String structuredOutputJson;

    @Column(nullable = false, length = 50)
    private String status = "COMPLETED"; // RUNNING, COMPLETED, FAILED, REQUIRES_APPROVAL

    @Column(name = "requires_human_approval", nullable = false)
    private boolean requiresHumanApproval = false;

    @Column(name = "approved_by", length = 100)
    private String approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "execution_time_ms", nullable = false)
    private int executionTimeMs = 0;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @OneToMany(mappedBy = "agentRun", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<AgentTool> toolsUsed = new ArrayList<>();

    public AgentRun() {}

    public AgentRun(String runId, String agentId, String agentName, String triggerType, String caseId, String structuredOutputJson, int executionTimeMs) {
        this.runId = runId;
        this.agentId = agentId;
        this.agentName = agentName;
        this.triggerType = triggerType;
        this.caseId = caseId;
        this.structuredOutputJson = structuredOutputJson;
        this.executionTimeMs = executionTimeMs;
        this.timestamp = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getRunId() { return runId; }
    public void setRunId(String runId) { this.runId = runId; }

    public String getAgentId() { return agentId; }
    public void setAgentId(String agentId) { this.agentId = agentId; }

    public String getAgentName() { return agentName; }
    public void setAgentName(String agentName) { this.agentName = agentName; }

    public String getTriggerType() { return triggerType; }
    public void setTriggerType(String triggerType) { this.triggerType = triggerType; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public String getModelVersion() { return modelVersion; }
    public void setModelVersion(String modelVersion) { this.modelVersion = modelVersion; }

    public String getInputSnapshotJson() { return inputSnapshotJson; }
    public void setInputSnapshotJson(String inputSnapshotJson) { this.inputSnapshotJson = inputSnapshotJson; }

    public String getStructuredOutputJson() { return structuredOutputJson; }
    public void setStructuredOutputJson(String structuredOutputJson) { this.structuredOutputJson = structuredOutputJson; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public boolean isRequiresHumanApproval() { return requiresHumanApproval; }
    public void setRequiresHumanApproval(boolean requiresHumanApproval) { this.requiresHumanApproval = requiresHumanApproval; }

    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }

    public Instant getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Instant approvedAt) { this.approvedAt = approvedAt; }

    public int getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(int executionTimeMs) { this.executionTimeMs = executionTimeMs; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public List<AgentTool> getToolsUsed() { return toolsUsed; }
    public void setToolsUsed(List<AgentTool> toolsUsed) { this.toolsUsed = toolsUsed; }
}
