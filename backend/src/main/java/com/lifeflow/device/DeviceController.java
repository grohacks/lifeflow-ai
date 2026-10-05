package com.lifeflow.device;

import com.lifeflow.common.ApiResponse;
import com.lifeflow.common.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/devices")
public class DeviceController {

    private final DeviceService deviceService;

    public DeviceController(DeviceService deviceService) {
        this.deviceService = deviceService;
    }

    @PostMapping("/observations")
    public ResponseEntity<ApiResponse<SensorObservation>> ingestObservation(
            @Valid @RequestBody DeviceDtos.ObservationEventDto dto,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        dto.setCorrelationId(correlationId);
        SensorObservation saved = deviceService.processObservation(dto);
        return ResponseEntity.ok(ApiResponse.ok("Observation processed", saved, correlationId));
    }

    @PostMapping("/sync")
    public ResponseEntity<ApiResponse<DeviceDtos.SyncBatchResponse>> syncBatch(
            @RequestBody DeviceDtos.SyncBatchRequest syncRequest,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        syncRequest.setCorrelationId(correlationId);
        DeviceDtos.SyncBatchResponse response = deviceService.syncBatch(syncRequest);
        return ResponseEntity.ok(ApiResponse.ok("Batch synchronization completed", response, correlationId));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DeviceDtos.MedicalDeviceDto>>> getAllDevices(HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<DeviceDtos.MedicalDeviceDto> devices = deviceService.getAllDevices();
        return ResponseEntity.ok(ApiResponse.ok(devices, correlationId));
    }

    @GetMapping("/ambulance/{ambulanceId}")
    public ResponseEntity<ApiResponse<List<DeviceDtos.MedicalDeviceDto>>> getDevicesByAmbulance(
            @PathVariable Long ambulanceId,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<DeviceDtos.MedicalDeviceDto> devices = deviceService.getDevicesByAmbulance(ambulanceId);
        return ResponseEntity.ok(ApiResponse.ok(devices, correlationId));
    }

    @GetMapping("/observations/case/{caseId}")
    public ResponseEntity<ApiResponse<List<SensorObservation>>> getObservationsByCase(
            @PathVariable String caseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<SensorObservation> observations = deviceService.getObservationsByCase(caseId, page, size);
        return ResponseEntity.ok(ApiResponse.ok(observations, correlationId));
    }
}
