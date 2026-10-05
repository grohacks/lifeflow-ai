package com.lifeflow.audit;

import com.lifeflow.common.ApiResponse;
import com.lifeflow.common.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditService auditService;

    public AuditController(AuditService auditService) {
        this.auditService = auditService;
    }

    @GetMapping("/case/{caseId}")
    public ResponseEntity<ApiResponse<List<AuditEvent>>> getAuditByCase(
            @PathVariable String caseId, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<AuditEvent> events = auditService.getAuditByCase(caseId);
        return ResponseEntity.ok(ApiResponse.ok(events, correlationId));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AuditEvent>>> getAllAuditEvents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        Page<AuditEvent> events = auditService.getAllAuditEvents(page, size);
        return ResponseEntity.ok(ApiResponse.ok(events, correlationId));
    }
}
