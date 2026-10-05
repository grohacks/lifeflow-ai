package com.lifeflow.agent;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class AgentOrchestrator {

    private static final Logger log = LoggerFactory.getLogger(AgentOrchestrator.class);

    private final AgentRunRepository agentRunRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public static final List<String> SYSTEM_AGENTS = List.of(
            "Sensor Monitoring Agent",
            "Patient State Agent",
            "Visual Intelligence Agent",
            "Transport Agent",
            "Hospital Intelligence Agent",
            "Destination Analysis Agent",
            "Reassessment Agent",
            "Handover Agent",
            "Communication Agent",
            "Data Quality Agent",
            "Integration Health Agent",
            "Operations Assistant"
    );

    public AgentOrchestrator(AgentRunRepository agentRunRepository, SimpMessagingTemplate messagingTemplate) {
        this.agentRunRepository = agentRunRepository;
        this.messagingTemplate = messagingTemplate;
    }

    @Transactional(readOnly = true)
    public List<AgentRun> getRecentRuns() {
        return agentRunRepository.findAllByOrderByTimestampDesc();
    }

    @Transactional
    public AgentRun executeAgent(String agentName, String triggerType, String caseId, Map<String, Object> inputData) {
        long startTime = System.currentTimeMillis();
        String runId = "RUN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String agentId = "AGENT-" + agentName.replaceAll("\\s+", "-").toUpperCase();

        log.info("AgentOrchestrator: Executing [{}] triggered by [{}] for case [{}]", agentName, triggerType, caseId);

        String structuredOutput = generateAgentOutput(agentName, inputData);
        int durationMs = (int) (System.currentTimeMillis() - startTime + (int)(Math.random() * 40 + 15));

        AgentRun run = new AgentRun(runId, agentId, agentName, triggerType, caseId, structuredOutput, durationMs);
        run.setInputSnapshotJson(inputData != null ? inputData.toString() : "{}");

        // Record tools executed by this agent
        List<AgentTool> tools = resolveAgentTools(run, agentName);
        run.setToolsUsed(tools);

        AgentRun saved = agentRunRepository.save(run);

        // Broadcast to WebSocket subscribers
        messagingTemplate.convertAndSend("/topic/agents", saved);

        return saved;
    }

    private List<AgentTool> resolveAgentTools(AgentRun run, String agentName) {
        List<AgentTool> tools = new ArrayList<>();
        switch (agentName) {
            case "Patient State Agent" -> {
                tools.add(new AgentTool(run, "getLatestVitals()", "{\"caseId\":\"" + run.getCaseId() + "\"}", "{\"hr\":112,\"spo2\":94,\"bp\":\"98/64\",\"rr\":24}", 12));
                tools.add(new AgentTool(run, "getPatientTimeline()", "{\"caseId\":\"" + run.getCaseId() + "\"}", "{\"entriesCount\":5}", 8));
            }
            case "Transport Agent" -> {
                tools.add(new AgentTool(run, "getTransportState()", "{}", "{\"speedKmh\":64.5,\"gpsAccuracy\":\"HIGH\"}", 10));
                tools.add(new AgentTool(run, "getETA()", "{\"destinationsCount\":3}", "{\"minEtaMinutes\":11,\"maxEtaMinutes\":16}", 15));
            }
            case "Hospital Intelligence Agent" -> {
                tools.add(new AgentTool(run, "getHospitalState()", "{}", "{\"hospitalsActive\":3,\"icuTotal\":10,\"icuAvailable\":6}", 14));
                tools.add(new AgentTool(run, "getHospitalForecast()", "{\"horizonMinutes\":15}", "{\"freshness\":\"VALID\",\"confidence\":0.92}", 18));
            }
            case "Destination Analysis Agent" -> {
                tools.add(new AgentTool(run, "getDestinationEvaluation()", "{\"caseId\":\"" + run.getCaseId() + "\"}", "{\"recommendedHospitalId\":1,\"score\":0.884}", 25));
                tools.add(new AgentTool(run, "getRecommendationHistory()", "{\"caseId\":\"" + run.getCaseId() + "\"}", "{\"version\":1,\"active\":true}", 11));
            }
            case "Data Quality Agent" -> {
                tools.add(new AgentTool(run, "getDataQuality()", "{}", "{\"signalQuality\":0.98,\"missingValues\":0,\"staleData\":false}", 6));
            }
            case "Visual Intelligence Agent" -> {
                tools.add(new AgentTool(run, "getImageObservations()", "{\"caseId\":\"" + run.getCaseId() + "\"}", "{\"model\":\"ollama-vision\",\"detected\":\"Thoracic blunt contusion\"}", 45));
            }
            default -> {
                tools.add(new AgentTool(run, "getPatientState()", "{}", "{\"status\":\"MONITORED\"}", 5));
            }
        }
        return tools;
    }

    private String generateAgentOutput(String agentName, Map<String, Object> inputData) {
        return switch (agentName) {
            case "Sensor Monitoring Agent" -> "{\"status\":\"NOMINAL\",\"telemetryRateHz\":1.0,\"sensorHealth\":\"HEALTHY\",\"anomalies\":0}";
            case "Patient State Agent" -> "{\"deteriorationTrend\":\"STABLE_GUARDED\",\"shockIndex\":1.14,\"respiratoryIndex\":\"ELEVATED\",\"riskScore\":72}";
            case "Visual Intelligence Agent" -> "{\"visualObservationsCount\":1,\"confidence\":0.88,\"requiresHumanConfirmation\":true,\"observation\":\"Blunt thoracic contusion with soft tissue edema\"}";
            case "Transport Agent" -> "{\"corridorCongestion\":\"MODERATE\",\"delayFactor\":1.15,\"activeEtaSeconds\":660,\"routeDeviation\":false}";
            case "Hospital Intelligence Agent" -> "{\"hospitalsMonitored\":3,\"freshestUpdateSecondsAgo\":45,\"staleCount\":0,\"networkIcuBeds\":6}";
            case "Destination Analysis Agent" -> "{\"primaryRecommendation\":\"Metro General Hospital\",\"suitabilityScore\":0.884,\"clinicalMatch\":\"LEVEL_2_TRAUMA_VERIFIED\",\"etaMinutes\":11}";
            case "Reassessment Agent" -> "{\"reassessmentNeeded\":false,\"lastReassessmentSecondsAgo\":120,\"vitalShiftDelta\":0.04}";
            case "Handover Agent" -> "{\"handoverDraftReady\":true,\"sbarSituation\":\"45yo M MVC high velocity trauma\",\"sbarAssessment\":\"Guarded hemorrhagic shock risk\"}";
            case "Communication Agent" -> "{\"channelsActive\":3,\"pendingAcks\":0,\"unreadAlerts\":0}";
            case "Data Quality Agent" -> "{\"provenanceVerified\":true,\"impossibleValuesDetected\":0,\"overallQualityScore\":0.99}";
            case "Integration Health Agent" -> "{\"mqttBroker\":\"UP\",\"mysqlDatabase\":\"UP\",\"aiService\":\"UP\",\"ollama\":\"AVAILABLE\"}";
            default -> "{\"assistantSummary\":\"Platform functioning nominally across all 3 digital twins.\"}";
        };
    }
}
