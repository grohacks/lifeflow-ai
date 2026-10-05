package com.lifeflow.patient;

import com.lifeflow.common.ApiResponse;
import com.lifeflow.common.CorrelationIdFilter;
import com.lifeflow.twin.PatientTwinService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.lifeflow.incident.IncidentRepository;
import com.lifeflow.incident.EmergencyIncident;
import com.lifeflow.websocket.WebSocketMessageService;
import java.io.IOException;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;
    private final PatientTwinService patientTwinService;
    private final WebSocketMessageService webSocketMessageService;
    private final IncidentRepository incidentRepository;

    public PatientController(PatientService patientService,
                             PatientTwinService patientTwinService,
                             WebSocketMessageService webSocketMessageService,
                             IncidentRepository incidentRepository) {
        this.patientService = patientService;
        this.patientTwinService = patientTwinService;
        this.webSocketMessageService = webSocketMessageService;
        this.incidentRepository = incidentRepository;
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<PatientDtos.PatientCaseDto>>> getActiveCases(HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<PatientDtos.PatientCaseDto> cases = patientService.getActiveCases();
        return ResponseEntity.ok(ApiResponse.ok(cases, correlationId));
    }

    @GetMapping("/{caseId}")
    public ResponseEntity<ApiResponse<PatientDtos.PatientCaseDto>> getCaseById(
            @PathVariable String caseId, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        PatientDtos.PatientCaseDto patientCase = patientService.getCaseById(caseId);
        return ResponseEntity.ok(ApiResponse.ok(patientCase, correlationId));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PatientDtos.PatientCaseDto>> createCase(
            @Valid @RequestBody PatientDtos.CreatePatientCaseRequest createRequest,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        PatientDtos.PatientCaseDto created = patientService.createCase(createRequest);
        return ResponseEntity.ok(ApiResponse.ok("Patient case created", created, correlationId));
    }

    @PostMapping("/{caseId}/observations")
    public ResponseEntity<ApiResponse<PatientObservation>> addObservation(
            @PathVariable String caseId,
            @Valid @RequestBody PatientDtos.ParamedicObservationRequest req,
            Authentication auth,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        req.setCaseId(caseId);
        String user = auth != null ? auth.getName() : "PARAMEDIC";
        PatientObservation obs = patientService.addObservation(req, user);
        return ResponseEntity.ok(ApiResponse.ok("Observation recorded", obs, correlationId));
    }

    @PostMapping("/{caseId}/interventions")
    public ResponseEntity<ApiResponse<PatientIntervention>> addIntervention(
            @PathVariable String caseId,
            @Valid @RequestBody PatientDtos.ParamedicInterventionRequest req,
            Authentication auth,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        req.setCaseId(caseId);
        String user = auth != null ? auth.getName() : "PARAMEDIC";
        PatientIntervention interv = patientService.addIntervention(req, user);
        return ResponseEntity.ok(ApiResponse.ok("Intervention recorded", interv, correlationId));
    }

    @PostMapping(value = "/{caseId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PatientImage>> uploadImage(
            @PathVariable String caseId,
            @RequestParam("file") MultipartFile file,
            Authentication auth,
            HttpServletRequest request) throws IOException, NoSuchAlgorithmException {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        String user = auth != null ? auth.getName() : "PARAMEDIC";
        PatientImage image = patientService.storeAndAnalyzeImage(caseId, file, user);
        return ResponseEntity.ok(ApiResponse.ok("Injury image uploaded and analyzed", image, correlationId));
    }

    @PostMapping(value = "/{caseId}/vision-vitals", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<PatientImage>> scanVisionVitals(
            @PathVariable String caseId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mode", defaultValue = "MONITOR_SCREEN") String mode,
            @RequestParam(value = "spo2", required = false) Double spo2,
            @RequestParam(value = "heartRate", required = false) Double heartRate,
            @RequestParam(value = "systolicBp", required = false) Double systolicBp,
            @RequestParam(value = "diastolicBp", required = false) Double diastolicBp,
            @RequestParam(value = "respiratoryRate", required = false) Double respiratoryRate,
            @RequestParam(value = "notes", required = false) String notes,
            Authentication auth,
            HttpServletRequest request) throws IOException, NoSuchAlgorithmException {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        String user = auth != null ? auth.getName() : "PARAMEDIC";
        PatientImage image = patientService.processVisionVitals(caseId, file, mode, spo2, heartRate, systolicBp, diastolicBp, respiratoryRate, notes, user);
        return ResponseEntity.ok(ApiResponse.ok("Vision vitals and trauma analyzed and populated to digital twin", image, correlationId));
    }

    @PostMapping("/{caseId}/vitals-telemetry")
    public ResponseEntity<ApiResponse<PatientDtos.PatientTwinDto>> injectVitalsTelemetry(
            @PathVariable String caseId,
            @RequestBody java.util.Map<String, Object> vitals,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        PatientDtos.PatientTwinDto updated = patientTwinService.updateVitalsFromTelemetry(caseId, vitals);
        return ResponseEntity.ok(ApiResponse.ok("Telemetry vitals updated", updated, correlationId));
    }

    @GetMapping("/{caseId}/twin")
    public ResponseEntity<ApiResponse<PatientDtos.PatientTwinDto>> getPatientTwin(
            @PathVariable String caseId, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        PatientDtos.PatientTwinDto twin = patientTwinService.getPatientTwin(caseId);
        return ResponseEntity.ok(ApiResponse.ok(twin, correlationId));
    }

    @GetMapping("/{caseId}/timeline")
    public ResponseEntity<ApiResponse<PatientDtos.PatientTimelineDto>> getPatientTimeline(
            @PathVariable String caseId, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        PatientDtos.PatientTimelineDto timeline = patientService.getTimeline(caseId);
        return ResponseEntity.ok(ApiResponse.ok(timeline, correlationId));
    }

    @GetMapping("/{caseId}/forecast")
    public ResponseEntity<ApiResponse<List<PatientForecast>>> getPatientForecast(
            @PathVariable String caseId, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<PatientForecast> forecasts = patientService.getForecasts(caseId);
        return ResponseEntity.ok(ApiResponse.ok(forecasts, correlationId));
    }

    @PostMapping(value = "/{caseId}/snap-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadCameraSnap(
            @PathVariable String caseId,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) throws IOException {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        byte[] bytes = file.getBytes();
        String base64 = Base64.getEncoder().encodeToString(bytes);
        String dataUrl = "data:" + (file.getContentType() != null ? file.getContentType() : "image/jpeg") + ";base64," + base64;

        Map<String, Object> payload = new HashMap<>();
        payload.put("isSnap", true);
        payload.put("highResSnap", dataUrl);
        payload.put("source", "PARAMEDIC_CABIN");
        payload.put("label", "Ambulance Cabin Camera Snap");
        payload.put("timestamp", System.currentTimeMillis());

        try {
            PatientService.ImageVisionAnalysis analysis = patientService.runVisionAnalysis(bytes, "PATIENT_TRAUMA", "Ambulance Cabin Scan");
            if (analysis != null) {
                payload.put("aiFinding", analysis.findingSummary);
                payload.put("injuryRegion", analysis.injuryRegion);
                payload.put("bleedingDesc", analysis.bleedingDesc);
                payload.put("confidence", analysis.confidence);
                payload.put("spo2", analysis.spo2);
                payload.put("heartRate", analysis.hr);

                try {
                    Map<String, Object> vitals = new HashMap<>();
                    if (analysis.hr > 0) vitals.put("heartRate", analysis.hr);
                    if (analysis.spo2 > 0) vitals.put("spo2", analysis.spo2);
                    if (analysis.sys > 0) vitals.put("systolicBp", analysis.sys);
                    if (analysis.dia > 0) vitals.put("diastolicBp", analysis.dia);
                    if (analysis.rr > 0) vitals.put("respiratoryRate", analysis.rr);
                    if (analysis.findingSummary != null) vitals.put("injuryObservations", analysis.injuryRegion + ": " + analysis.findingSummary);
                    patientTwinService.updateVitalsFromTelemetry(caseId, vitals);
                } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {}

        // Cache in-memory for instant holding tray retrieval on PC
        registerSnap(caseId, payload);

        webSocketMessageService.broadcastCameraSnap(caseId, payload);
        return ResponseEntity.ok(ApiResponse.ok("Camera snap received and broadcast to tray", payload, correlationId));
    }

    @PostMapping(value = {"/{caseId}/snap-dataurl", "/{caseId}/snap-upload"}, consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadSnapDataUrl(
            @PathVariable String caseId,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        String dataUrl = (String) body.get("dataUrl");
        String label = (String) body.getOrDefault("label", "Ambulance Cabin Camera Snap");
        String source = (String) body.getOrDefault("source", "PARAMEDIC_CABIN");

        Map<String, Object> payload = new HashMap<>();
        payload.put("isSnap", true);
        payload.put("highResSnap", dataUrl);
        payload.put("label", label);
        payload.put("source", source);
        payload.put("timestamp", System.currentTimeMillis());

        if (dataUrl != null && dataUrl.contains(",")) {
            try {
                byte[] bytes = Base64.getDecoder().decode(dataUrl.substring(dataUrl.indexOf(",") + 1));
                PatientService.ImageVisionAnalysis analysis = patientService.runVisionAnalysis(bytes, "PATIENT_TRAUMA", label);
                if (analysis != null) {
                    payload.put("aiFinding", analysis.findingSummary);
                    payload.put("injuryRegion", analysis.injuryRegion);
                    payload.put("bleedingDesc", analysis.bleedingDesc);
                    payload.put("confidence", analysis.confidence);
                    payload.put("spo2", analysis.spo2);
                    payload.put("heartRate", analysis.hr);

                    try {
                        Map<String, Object> vitals = new HashMap<>();
                        if (analysis.hr > 0) vitals.put("heartRate", analysis.hr);
                        if (analysis.spo2 > 0) vitals.put("spo2", analysis.spo2);
                        if (analysis.sys > 0) vitals.put("systolicBp", analysis.sys);
                        if (analysis.dia > 0) vitals.put("diastolicBp", analysis.dia);
                        if (analysis.rr > 0) vitals.put("respiratoryRate", analysis.rr);
                        if (analysis.findingSummary != null) vitals.put("injuryObservations", analysis.injuryRegion + ": " + analysis.findingSummary);
                        patientTwinService.updateVitalsFromTelemetry(caseId, vitals);
                    } catch (Exception ignored) {}
                }
            } catch (Exception ignored) {}
        }

        patientService.registerSnap(caseId, payload);
        webSocketMessageService.broadcastCameraSnap(caseId, payload);
        return ResponseEntity.ok(ApiResponse.ok("Snap dataUrl recorded and broadcast", payload, correlationId));
    }

    @PostMapping(value = "/analyze-image", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> analyzeImageJson(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        String dataUrl = (String) body.get("dataUrl");
        String scanMode = (String) body.getOrDefault("scanMode", "PATIENT_TRAUMA");
        String notes = (String) body.getOrDefault("notes", "Emergency field inspection");

        if (dataUrl == null || !dataUrl.contains(",")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Missing or invalid dataUrl", correlationId));
        }

        byte[] bytes = Base64.getDecoder().decode(dataUrl.substring(dataUrl.indexOf(",") + 1));
        return processVisionAnalysis(bytes, scanMode, notes, correlationId);
    }

    @PostMapping(value = "/analyze-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> analyzeImageMultipart(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "scanMode", required = false, defaultValue = "PATIENT_TRAUMA") String scanMode,
            @RequestParam(value = "customNotes", required = false, defaultValue = "Emergency field inspection") String notes,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        try {
            byte[] bytes = file.getBytes();
            return processVisionAnalysis(bytes, scanMode, notes, correlationId);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to read image bytes: " + e.getMessage(), correlationId));
        }
    }

    private ResponseEntity<ApiResponse<Map<String, Object>>> processVisionAnalysis(
            byte[] bytes, String scanMode, String notes, String correlationId) {
        PatientService.ImageVisionAnalysis analysis = patientService.runVisionAnalysis(bytes, scanMode, notes);

        Map<String, Object> result = new HashMap<>();
        result.put("findingSummary", analysis.findingSummary);
        result.put("injuryRegion", analysis.injuryRegion);
        result.put("bleedingDesc", analysis.bleedingDesc);
        result.put("confidence", Math.round(analysis.confidence * 100));
        result.put("spo2", Math.round(analysis.spo2));
        result.put("heartRate", Math.round(analysis.hr));
        result.put("systolicBp", Math.round(analysis.sys));
        result.put("diastolicBp", Math.round(analysis.dia));
        result.put("respiratoryRate", Math.round(analysis.rr));
        boolean isCritical = analysis.hr > 115 || analysis.spo2 < 92 || (analysis.bleedingDesc != null && analysis.bleedingDesc.toLowerCase().contains("hemorrhage"));
        result.put("severity", isCritical ? "CRITICAL" : "MODERATE");
        result.put("priority", isCritical ? "RED" : "YELLOW");

        return ResponseEntity.ok(ApiResponse.ok("Image analyzed successfully with Clinical Vision AI", result, correlationId));
    }

    public void registerSnap(String caseId, Map<String, Object> snapPayload) {
        patientService.registerSnap(caseId, snapPayload);
    }

    @GetMapping("/{caseId}/snaps")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPatientSnaps(
            @PathVariable String caseId, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<Map<String, Object>> result = patientService.getSnaps(caseId);
        return ResponseEntity.ok(ApiResponse.ok("Held camera snaps", result, correlationId));
    }

    @DeleteMapping("/{caseId}/snaps")
    public ResponseEntity<ApiResponse<Void>> clearPatientSnaps(
            @PathVariable String caseId, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        patientService.clearSnaps(caseId);
        return ResponseEntity.ok(ApiResponse.ok("Snaps cleared", null, correlationId));
    }
}
