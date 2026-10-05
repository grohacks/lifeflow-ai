package com.lifeflow.transport;

import com.lifeflow.common.ApiResponse;
import com.lifeflow.common.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transport")
public class TransportController {

    private final TransportService transportService;

    public TransportController(TransportService transportService) {
        this.transportService = transportService;
    }

    @GetMapping("/ambulance/{ambulanceId}/state")
    public ResponseEntity<ApiResponse<TransportDtos.AmbulanceStateDto>> getLatestState(
            @PathVariable Long ambulanceId, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        TransportDtos.AmbulanceStateDto state = transportService.getLatestState(ambulanceId);
        return ResponseEntity.ok(ApiResponse.ok(state, correlationId));
    }

    @GetMapping("/ambulance/{ambulanceId}/routes")
    public ResponseEntity<ApiResponse<List<TransportDtos.RouteDto>>> getActiveRoutes(
            @PathVariable Long ambulanceId, HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        List<TransportDtos.RouteDto> routes = transportService.getActiveRoutes(ambulanceId);
        return ResponseEntity.ok(ApiResponse.ok(routes, correlationId));
    }

    @PostMapping("/gps")
    public ResponseEntity<ApiResponse<AmbulanceState>> updateGps(
            @Valid @RequestBody TransportDtos.UpdateGpsRequest gpsRequest,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        AmbulanceState updated = transportService.updateGpsLocation(gpsRequest, correlationId);
        return ResponseEntity.ok(ApiResponse.ok("GPS updated", updated, correlationId));
    }

    @PostMapping("/traffic")
    public ResponseEntity<ApiResponse<String>> updateTraffic(
            @Valid @RequestBody TransportDtos.UpdateTrafficRequest trafficRequest,
            HttpServletRequest request) {
        String correlationId = CorrelationIdFilter.getCorrelationId(request);
        transportService.updateTraffic(trafficRequest.getAmbulanceId(), trafficRequest.getTrafficMultiplier());
        return ResponseEntity.ok(ApiResponse.ok("Traffic condition updated to " + trafficRequest.getTrafficMultiplier(), null, correlationId));
    }
}
