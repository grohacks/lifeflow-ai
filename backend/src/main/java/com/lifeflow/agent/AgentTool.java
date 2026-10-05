package com.lifeflow.agent;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "agent_tools")
public class AgentTool {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_run_id", nullable = false)
    @JsonIgnore
    private AgentRun agentRun;

    @Column(name = "tool_name", nullable = false, length = 100)
    private String toolName;

    @Column(name = "parameters_json", columnDefinition = "TEXT")
    private String parametersJson;

    @Column(name = "result_json", columnDefinition = "LONGTEXT")
    private String resultJson;

    @Column(name = "execution_time_ms")
    private int executionTimeMs = 0;

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    public AgentTool() {}

    public AgentTool(AgentRun agentRun, String toolName, String parametersJson, String resultJson, int executionTimeMs) {
        this.agentRun = agentRun;
        this.toolName = toolName;
        this.parametersJson = parametersJson;
        this.resultJson = resultJson;
        this.executionTimeMs = executionTimeMs;
        this.timestamp = Instant.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public AgentRun getAgentRun() { return agentRun; }
    public void setAgentRun(AgentRun agentRun) { this.agentRun = agentRun; }

    public String getToolName() { return toolName; }
    public void setToolName(String toolName) { this.toolName = toolName; }

    public String getParametersJson() { return parametersJson; }
    public void setParametersJson(String parametersJson) { this.parametersJson = parametersJson; }

    public String getResultJson() { return resultJson; }
    public void setResultJson(String resultJson) { this.resultJson = resultJson; }

    public int getExecutionTimeMs() { return executionTimeMs; }
    public void setExecutionTimeMs(int executionTimeMs) { this.executionTimeMs = executionTimeMs; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }
}
