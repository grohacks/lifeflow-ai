package com.lifeflow.agent;

import com.lifeflow.common.ApiResponse;
import com.lifeflow.common.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agents")
public class AgentController {

    private final AgentOrchestrator agentOrchestrator;

    public AgentController(AgentOrchestrator agentOrchestrator) {
        this.agentOrchestrator = agentOrchestrator;
    }

    @GetMapping("/runs")
    public ResponseEntity<ApiResponse<List<AgentRun>>> getRecentRuns(HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<AgentRun> runs = agentOrchestrator.getRecentRuns();
        return ResponseEntity.ok(ApiResponse.ok(runs, correlationId));
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<String>>> getSystemAgents(HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        return ResponseEntity.ok(ApiResponse.ok(AgentOrchestrator.SYSTEM_AGENTS, correlationId));
    }

    public static class ExecuteAgentRequest {
        public String agentName;
        public String caseId;
        public String triggerType;
        public Map<String, Object> inputData;
    }

    @PostMapping("/execute")
    public ResponseEntity<ApiResponse<AgentRun>> executeAgent(
            @RequestBody ExecuteAgentRequest req,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        AgentRun run = agentOrchestrator.executeAgent(
                req.agentName != null ? req.agentName : "Operations Assistant",
                req.triggerType != null ? req.triggerType : "MANUAL_PROMPT",
                req.caseId != null ? req.caseId : "CASE-2026-001",
                req.inputData
        );
        return ResponseEntity.ok(ApiResponse.ok("Agent executed successfully", run, correlationId));
    }
}
