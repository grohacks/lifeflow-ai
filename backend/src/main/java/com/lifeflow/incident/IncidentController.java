package com.lifeflow.incident;

import com.lifeflow.common.ApiResponse;
import com.lifeflow.common.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @PostMapping("/sos")
    public ResponseEntity<ApiResponse<IncidentDtos.IncidentDto>> reportSos(
            @RequestBody IncidentDtos.SosReportRequest request,
            HttpServletRequest httpRequest) {
        String correlationId = CorrelationIdFilter.getCorrelationId(httpRequest);
        IncidentDtos.IncidentDto dto = incidentService.reportCitizenSos(request);
        return ResponseEntity.ok(ApiResponse.ok("Emergency SOS reported and ambulance dispatched", dto, correlationId));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<IncidentDtos.IncidentDto>>> getActiveIncidents(HttpServletRequest httpRequest) {
        String correlationId = CorrelationIdFilter.getCorrelationId(httpRequest);
        List<IncidentDtos.IncidentDto> incidents = incidentService.getActiveIncidents();
        return ResponseEntity.ok(ApiResponse.ok(incidents, correlationId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<IncidentDtos.IncidentDto>> getIncidentById(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        String correlationId = CorrelationIdFilter.getCorrelationId(httpRequest);
        IncidentDtos.IncidentDto dto = incidentService.getIncidentById(id);
        return ResponseEntity.ok(ApiResponse.ok(dto, correlationId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<IncidentDtos.IncidentDto>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            HttpServletRequest httpRequest) {
        String correlationId = CorrelationIdFilter.getCorrelationId(httpRequest);
        String status = body.getOrDefault("status", "EN_ROUTE_SCENE");
        IncidentDtos.IncidentDto dto = incidentService.updateStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Incident status updated", dto, correlationId));
    }

    @PostMapping("/{id}/board-patient")
    public ResponseEntity<ApiResponse<IncidentDtos.IncidentDto>> boardPatient(
            @PathVariable Long id,
            HttpServletRequest httpRequest) {
        String correlationId = CorrelationIdFilter.getCorrelationId(httpRequest);
        IncidentDtos.IncidentDto dto = incidentService.boardPatientAndStartCare(id);
        return ResponseEntity.ok(ApiResponse.ok("Patient boarded, digital twin case initialized", dto, correlationId));
    }

    @RequestMapping(value = "/sms-webhook", method = {RequestMethod.POST, RequestMethod.GET})
    public ResponseEntity<ApiResponse<IncidentDtos.IncidentDto>> handleSmsWebhook(
            @RequestBody(required = false) IncidentDtos.SmsWebhookRequest request,
            @RequestParam(value = "from", required = false) String paramFrom,
            @RequestParam(value = "body", required = false) String paramBody,
            @RequestParam(value = "message", required = false) String paramMessage,
            @RequestParam(value = "text", required = false) String paramText,
            @RequestParam(value = "latitude", required = false) Double paramLat,
            @RequestParam(value = "longitude", required = false) Double paramLng,
            HttpServletRequest httpRequest) {
        String correlationId = CorrelationIdFilter.getCorrelationId(httpRequest);
        if (request == null) {
            request = new IncidentDtos.SmsWebhookRequest();
        }
        if (request.getFrom() == null && paramFrom != null) {
            request.setFrom(paramFrom);
        }
        String resolvedBody = request.getBody();
        if (resolvedBody == null || resolvedBody.isBlank()) {
            if (paramBody != null && !paramBody.isBlank()) {
                request.setBody(paramBody);
            } else if (paramMessage != null && !paramMessage.isBlank()) {
                request.setBody(paramMessage);
            } else if (paramText != null && !paramText.isBlank()) {
                request.setBody(paramText);
            }
        }
        if (request.getLatitude() == null && paramLat != null) {
            request.setLatitude(paramLat);
        }
        if (request.getLongitude() == null && paramLng != null) {
            request.setLongitude(paramLng);
        }
        IncidentDtos.IncidentDto dto = incidentService.processSmsDispatch(request);
        return ResponseEntity.ok(ApiResponse.ok("Emergency SMS parsed and ambulance dispatched", dto, correlationId));
    }

    @PostMapping("/call-webhook")
    public ResponseEntity<ApiResponse<IncidentDtos.IncidentDto>> handleCallWebhook(
            @RequestBody IncidentDtos.CallWebhookRequest request,
            HttpServletRequest httpRequest) {
        String correlationId = CorrelationIdFilter.getCorrelationId(httpRequest);
        IncidentDtos.IncidentDto dto = incidentService.processCallDispatch(request);
        return ResponseEntity.ok(ApiResponse.ok("Emergency Phone Call parsed and ambulance dispatched", dto, correlationId));
    }
}
