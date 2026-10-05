package com.lifeflow.decision;

import com.lifeflow.common.ApiResponse;
import com.lifeflow.common.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/decision")
public class DecisionController {

    private final DestinationDecisionEngine decisionEngine;

    public DecisionController(DestinationDecisionEngine decisionEngine) {
        this.decisionEngine = decisionEngine;
    }

    @GetMapping("/case/{caseId}/active")
    public ResponseEntity<ApiResponse<DecisionDtos.RecommendationDto>> getActiveRecommendation(
            @PathVariable String caseId, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        DecisionDtos.RecommendationDto dto = decisionEngine.getActiveRecommendation(caseId);
        return ResponseEntity.ok(ApiResponse.ok(dto, correlationId));
    }

    @GetMapping("/case/{caseId}/history")
    public ResponseEntity<ApiResponse<List<DecisionDtos.RecommendationDto>>> getRecommendationHistory(
            @PathVariable String caseId, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<DecisionDtos.RecommendationDto> history = decisionEngine.getRecommendationHistory(caseId);
        return ResponseEntity.ok(ApiResponse.ok(history, correlationId));
    }

    @PostMapping("/case/{caseId}/evaluate")
    public ResponseEntity<ApiResponse<DecisionDtos.RecommendationDto>> triggerEvaluation(
            @PathVariable String caseId, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        DecisionDtos.RecommendationDto dto = decisionEngine.evaluateDestinationsAndGetDto(caseId, correlationId);
        return ResponseEntity.ok(ApiResponse.ok("Evaluation completed", dto, correlationId));
    }
}
