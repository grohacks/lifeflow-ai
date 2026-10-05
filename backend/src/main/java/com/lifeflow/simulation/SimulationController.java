package com.lifeflow.simulation;

import com.lifeflow.common.ApiResponse;
import com.lifeflow.common.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/simulation")
public class SimulationController {

    private final SimulationService simulationService;

    public SimulationController(SimulationService simulationService) {
        this.simulationService = simulationService;
    }

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<Map<String, Object>>> startSimulation(HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        Map<String, Object> result = simulationService.startGoldenHourScenario();
        return ResponseEntity.ok(ApiResponse.ok("Golden Hour scenario launched", result, correlationId));
    }

    @PostMapping("/pause")
    public ResponseEntity<ApiResponse<String>> pauseSimulation(HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        simulationService.pause();
        return ResponseEntity.ok(ApiResponse.ok("Simulation paused", null, correlationId));
    }

    @PostMapping("/resume")
    public ResponseEntity<ApiResponse<String>> resumeSimulation(HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        simulationService.resume();
        return ResponseEntity.ok(ApiResponse.ok("Simulation resumed", null, correlationId));
    }

    @PostMapping("/reset")
    public ResponseEntity<ApiResponse<String>> resetSimulation(HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        simulationService.resetScenario();
        return ResponseEntity.ok(ApiResponse.ok("Simulation reset", null, correlationId));
    }

    @PostMapping("/speed")
    public ResponseEntity<ApiResponse<String>> setSpeed(
            @RequestParam(defaultValue = "1.0") double multiplier,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        simulationService.setSpeed(multiplier);
        return ResponseEntity.ok(ApiResponse.ok("Simulation speed set to " + multiplier + "x", null, correlationId));
    }

    @PostMapping("/trigger/deterioration")
    public ResponseEntity<ApiResponse<String>> triggerDeterioration(HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        simulationService.triggerPatientDeterioration();
        return ResponseEntity.ok(ApiResponse.ok("Patient deterioration event triggered (SpO2: 88%, HR: 131, RR: 32)", null, correlationId));
    }

    @PostMapping("/trigger/traffic")
    public ResponseEntity<ApiResponse<String>> triggerTraffic(
            @RequestParam(defaultValue = "1.8") double multiplier,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        simulationService.triggerTrafficChange(multiplier);
        return ResponseEntity.ok(ApiResponse.ok("Traffic surge triggered (multiplier: " + multiplier + "x)", null, correlationId));
    }

    @PostMapping("/trigger/hospital-resource")
    public ResponseEntity<ApiResponse<String>> triggerHospitalResource(
            @RequestParam(defaultValue = "HOSP-002") String code,
            @RequestParam(defaultValue = "ICU_BEDS") String type,
            @RequestParam(defaultValue = "0") int count,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        simulationService.triggerHospitalResourceChange(code, type, count);
        return ResponseEntity.ok(ApiResponse.ok("Hospital resource updated: " + code + " " + type + " -> " + count, null, correlationId));
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus(HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        Map<String, Object> status = simulationService.getStatus();
        return ResponseEntity.ok(ApiResponse.ok(status, correlationId));
    }
}
