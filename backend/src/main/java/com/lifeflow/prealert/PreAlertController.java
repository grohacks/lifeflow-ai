package com.lifeflow.prealert;

import com.lifeflow.common.ApiResponse;
import com.lifeflow.common.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/prealerts")
public class PreAlertController {

    private final PreAlertService preAlertService;

    public PreAlertController(PreAlertService preAlertService) {
        this.preAlertService = preAlertService;
    }

    @PostMapping("/decision")
    public ResponseEntity<ApiResponse<PreAlertDtos.PreAlertDto>> recordDecision(
            @Valid @RequestBody PreAlertDtos.RecordDecisionRequest req,
            Authentication auth,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        String userName = auth != null ? auth.getName() : "Paramedic Lead";
        PreAlertDtos.PreAlertDto preAlert = preAlertService.recordHumanDecisionAndCreatePreAlert(req, null, userName, correlationId);
        return ResponseEntity.ok(ApiResponse.ok("Destination decision confirmed and Pre-Alert dispatched to hospital", preAlert, correlationId));
    }

    @PostMapping("/{prealertId}/acknowledge")
    public ResponseEntity<ApiResponse<PreAlertDtos.PreAlertDto>> acknowledge(
            @PathVariable String prealertId,
            Authentication auth,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        String acknowledgedBy = auth != null ? auth.getName() : "ED Triage Nurse";
        PreAlertDtos.PreAlertDto ack = preAlertService.acknowledgePreAlert(prealertId, acknowledgedBy);
        return ResponseEntity.ok(ApiResponse.ok("Pre-alert accepted by hospital", ack, correlationId));
    }

    @PostMapping("/{prealertId}/accept")
    public ResponseEntity<ApiResponse<PreAlertDtos.PreAlertDto>> accept(
            @PathVariable String prealertId,
            Authentication auth,
            HttpServletRequest request) {
        return acknowledge(prealertId, auth, request);
    }

    @PostMapping("/{prealertId}/arrive")
    public ResponseEntity<ApiResponse<PreAlertDtos.PreAlertDto>> arrive(
            @PathVariable String prealertId,
            Authentication auth,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        String arrivedBy = auth != null ? auth.getName() : "PARAMEDIC";
        PreAlertDtos.PreAlertDto dto = preAlertService.markAmbulanceArrived(prealertId, arrivedBy);
        return ResponseEntity.ok(ApiResponse.ok("Ambulance arrived at destination Emergency Department", dto, correlationId));
    }

    @DeleteMapping("/hospital/{hospitalId}/clear")
    public ResponseEntity<ApiResponse<String>> clearHospitalQueue(
            @PathVariable Long hospitalId,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        preAlertService.clearPreAlertsForHospital(hospitalId);
        return ResponseEntity.ok(ApiResponse.ok("Pre-alert queue cleared successfully", "CLEARED", correlationId));
    }

    @DeleteMapping("/case/{caseId}")
    public ResponseEntity<ApiResponse<String>> clearCaseAlerts(
            @PathVariable String caseId,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        preAlertService.clearPreAlertsForCase(caseId);
        return ResponseEntity.ok(ApiResponse.ok("Pre-alerts for case cleared successfully", "CLEARED", correlationId));
    }

    @PostMapping("/{prealertId}/reserve")
    public ResponseEntity<ApiResponse<PreAlertDtos.PreAlertDto>> reserveResources(
            @PathVariable String prealertId,
            @RequestBody PreAlertDtos.ReserveResourcesRequest req,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        PreAlertDtos.PreAlertDto updated = preAlertService.reserveResources(prealertId, req);
        return ResponseEntity.ok(ApiResponse.ok("Resources reserved successfully", updated, correlationId));
    }

    @PostMapping("/{prealertId}/notify-doctor")
    public ResponseEntity<ApiResponse<PreAlertDtos.PreAlertDto>> notifyDoctor(
            @PathVariable String prealertId,
            @RequestBody PreAlertDtos.NotifyDoctorRequest req,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        PreAlertDtos.PreAlertDto updated = preAlertService.notifyDoctor(prealertId, req);
        return ResponseEntity.ok(ApiResponse.ok("Doctor notified successfully", updated, correlationId));
    }

    @PostMapping("/{prealertId}/doctor-orders")
    public ResponseEntity<ApiResponse<PreAlertDtos.PreAlertDto>> doctorOrders(
            @PathVariable String prealertId,
            @RequestBody PreAlertDtos.DoctorOrdersRequest req,
            Authentication auth,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        if (req.getDoctorName() == null && auth != null) {
            req.setDoctorName(auth.getName());
        }
        PreAlertDtos.PreAlertDto updated = preAlertService.saveDoctorOrders(prealertId, req);
        return ResponseEntity.ok(ApiResponse.ok("Doctor pre-arrival directives transmitted to ambulance", updated, correlationId));
    }

    @GetMapping("/hospital/{hospitalId}")
    public ResponseEntity<ApiResponse<List<PreAlertDtos.PreAlertDto>>> getPreAlertsForHospital(
            @PathVariable Long hospitalId, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<PreAlertDtos.PreAlertDto> alerts = preAlertService.getPreAlertsForHospital(hospitalId);
        return ResponseEntity.ok(ApiResponse.ok(alerts, correlationId));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PreAlertDtos.PreAlertDto>>> getAllPreAlerts(HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<PreAlertDtos.PreAlertDto> alerts = preAlertService.getAllPreAlerts();
        return ResponseEntity.ok(ApiResponse.ok(alerts, correlationId));
    }

    @GetMapping("/case/{caseId}/latest")
    public ResponseEntity<ApiResponse<PreAlertDtos.PreAlertDto>> getLatestPreAlertForCase(
            @PathVariable String caseId, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        PreAlertDtos.PreAlertDto alert = preAlertService.getLatestPreAlertForCase(caseId);
        return ResponseEntity.ok(ApiResponse.ok(alert, correlationId));
    }
}
