package com.lifeflow.hospital;

import com.lifeflow.common.ApiResponse;
import com.lifeflow.common.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/hospitals")
public class HospitalController {

    private final HospitalService hospitalService;

    public HospitalController(HospitalService hospitalService) {
        this.hospitalService = hospitalService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HospitalDtos.HospitalDto>>> getAllHospitals(HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<HospitalDtos.HospitalDto> hospitals = hospitalService.getAllHospitals();
        return ResponseEntity.ok(ApiResponse.ok(hospitals, correlationId));
    }

    @GetMapping("/{code}")
    public ResponseEntity<ApiResponse<HospitalDtos.HospitalDto>> getHospitalByCode(
            @PathVariable String code, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        HospitalDtos.HospitalDto hospital = hospitalService.getHospitalByCode(code);
        return ResponseEntity.ok(ApiResponse.ok(hospital, correlationId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_OPERATOR')")
    public ResponseEntity<ApiResponse<HospitalDtos.HospitalDto>> createHospital(
            @RequestBody HospitalDtos.CreateHospitalRequest createRequest,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        HospitalDtos.HospitalDto created = hospitalService.createHospital(createRequest);
        return ResponseEntity.ok(ApiResponse.ok("Hospital registered and resources provisioned successfully", created, correlationId));
    }

    @PostMapping("/{id}/resources")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_OPERATOR')")
    public ResponseEntity<ApiResponse<HospitalDtos.HospitalDto>> provisionResource(
            @PathVariable Long id,
            @RequestBody HospitalDtos.ProvisionResourceRequest resourceRequest,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        HospitalDtos.HospitalDto updated = hospitalService.provisionResource(id, resourceRequest);
        return ResponseEntity.ok(ApiResponse.ok("Resource provisioned successfully", updated, correlationId));
    }

    @PatchMapping("/{id}/resources")
    @PreAuthorize("hasAnyRole('ADMIN', 'HOSPITAL_OPERATOR')")
    public ResponseEntity<ApiResponse<HospitalDtos.HospitalDto>> updateResource(
            @PathVariable Long id,
            @RequestBody HospitalDtos.UpdateResourceRequest updateRequest,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        HospitalDtos.HospitalDto updated = hospitalService.updateResource(
                id, updateRequest.getResourceType(), updateRequest.getAvailableCount()
        );
        return ResponseEntity.ok(ApiResponse.ok("Resource updated successfully", updated, correlationId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> deleteHospital(
            @PathVariable Long id,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        hospitalService.deactivateHospital(id);
        return ResponseEntity.ok(ApiResponse.ok("Hospital deactivated successfully", "DEACTIVATED", correlationId));
    }
}
