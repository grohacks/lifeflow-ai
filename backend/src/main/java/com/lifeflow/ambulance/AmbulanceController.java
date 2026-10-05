package com.lifeflow.ambulance;

import com.lifeflow.common.ApiResponse;
import com.lifeflow.common.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ambulances")
public class AmbulanceController {

    private final AmbulanceService ambulanceService;

    public AmbulanceController(AmbulanceService ambulanceService) {
        this.ambulanceService = ambulanceService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AmbulanceDtos.AmbulanceDto>>> getAllAmbulances(HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<AmbulanceDtos.AmbulanceDto> ambulances = ambulanceService.getAllAmbulances();
        return ResponseEntity.ok(ApiResponse.ok(ambulances, correlationId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AmbulanceDtos.AmbulanceDto>> getAmbulanceById(
            @PathVariable Long id, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        AmbulanceDtos.AmbulanceDto ambulance = ambulanceService.getAmbulanceById(id);
        return ResponseEntity.ok(ApiResponse.ok(ambulance, correlationId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CONTROL_ROOM')")
    public ResponseEntity<ApiResponse<AmbulanceDtos.AmbulanceDto>> createAmbulance(
            @Valid @RequestBody AmbulanceDtos.CreateAmbulanceRequest createRequest,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        AmbulanceDtos.AmbulanceDto created = ambulanceService.createAmbulance(createRequest);
        return ResponseEntity.ok(ApiResponse.ok("Ambulance created successfully", created, correlationId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AmbulanceDtos.AmbulanceDto>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody AmbulanceDtos.UpdateAmbulanceStatusRequest statusRequest,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        AmbulanceDtos.AmbulanceDto updated = ambulanceService.updateStatus(id, statusRequest.getStatus());
        return ResponseEntity.ok(ApiResponse.ok("Status updated successfully", updated, correlationId));
    }
}
