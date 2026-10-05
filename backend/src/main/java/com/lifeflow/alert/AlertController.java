package com.lifeflow.alert;

import com.lifeflow.common.ApiResponse;
import com.lifeflow.common.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Alert>>> getAlerts(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<Alert> alerts = activeOnly ? alertService.getActiveAlerts() : alertService.getAllAlerts();
        return ResponseEntity.ok(ApiResponse.ok(alerts, correlationId));
    }

    public static class AcknowledgeRequest {
        public String acknowledgedBy;
    }

    @PostMapping("/{alertId}/acknowledge")
    public ResponseEntity<ApiResponse<Alert>> acknowledgeAlert(
            @PathVariable String alertId,
            @RequestBody(required = false) AcknowledgeRequest req,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        String ackBy = (req != null && req.acknowledgedBy != null) ? req.acknowledgedBy : "Clinical Staff";
        Alert alert = alertService.acknowledgeAlert(alertId, ackBy);
        return ResponseEntity.ok(ApiResponse.ok("Alert acknowledged", alert, correlationId));
    }
}
