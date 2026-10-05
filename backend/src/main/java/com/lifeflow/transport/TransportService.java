package com.lifeflow.transport;

import com.lifeflow.ambulance.Ambulance;
import com.lifeflow.ambulance.AmbulanceRepository;
import com.lifeflow.common.ResourceNotFoundException;
import com.lifeflow.decision.ReevaluationService;
import com.lifeflow.hospital.Hospital;
import com.lifeflow.hospital.HospitalRepository;
import com.lifeflow.routing.HaversineRouter;
import com.lifeflow.websocket.WebSocketMessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TransportService {

    private static final Logger log = LoggerFactory.getLogger(TransportService.class);

    private final AmbulanceStateRepository stateRepository;
    private final RouteRepository routeRepository;
    private final AmbulanceRepository ambulanceRepository;
    private final HospitalRepository hospitalRepository;
    private final HaversineRouter haversineRouter;
    private final WebSocketMessageService webSocketService;
    private final ReevaluationService reevaluationService;

    public TransportService(AmbulanceStateRepository stateRepository,
                            RouteRepository routeRepository,
                            AmbulanceRepository ambulanceRepository,
                            HospitalRepository hospitalRepository,
                            HaversineRouter haversineRouter,
                            @Lazy WebSocketMessageService webSocketService,
                            @Lazy ReevaluationService reevaluationService) {
        this.stateRepository = stateRepository;
        this.routeRepository = routeRepository;
        this.ambulanceRepository = ambulanceRepository;
        this.hospitalRepository = hospitalRepository;
        this.haversineRouter = haversineRouter;
        this.webSocketService = webSocketService;
        this.reevaluationService = reevaluationService;
    }

    @Transactional
    public AmbulanceState updateGpsLocation(TransportDtos.UpdateGpsRequest req, String correlationId) {
        Ambulance ambulance = ambulanceRepository.findById(req.getAmbulanceId())
                .orElseThrow(() -> new ResourceNotFoundException("Ambulance not found: " + req.getAmbulanceId()));

        AmbulanceState state = new AmbulanceState();
        state.setAmbulance(ambulance);
        state.setCaseId(req.getCaseId());
        state.setLatitude(req.getLatitude());
        state.setLongitude(req.getLongitude());
        state.setHeading(req.getHeading() != null ? req.getHeading() : 0.0);
        state.setSpeedKmh(req.getSpeedKmh() != null ? req.getSpeedKmh() : 45.0);
        state.setTimestamp(Instant.now());
        state.setCorrelationId(correlationId != null ? correlationId : UUID.randomUUID().toString());

        AmbulanceState saved = stateRepository.save(state);

        // Recalculate routes & ETAs to all candidate hospitals
        recalculateRoutes(ambulance, req.getLatitude(), req.getLongitude(), req.getSpeedKmh());

        // Broadcast over WebSocket
        webSocketService.broadcastAmbulanceMovement(ambulance.getId(), mapStateToDto(saved));

        return saved;
    }

    @Transactional
    public void recalculateRoutes(Ambulance ambulance, double currentLat, double currentLon, Double currentSpeed) {
        List<Hospital> hospitals = hospitalRepository.findByActiveTrue();
        double speed = (currentSpeed != null && currentSpeed > 5.0) ? currentSpeed : 45.0;

        for (Hospital hospital : hospitals) {
            double distanceKm = haversineRouter.calculateDistanceKm(
                    currentLat, currentLon, hospital.getLatitude(), hospital.getLongitude()
            );

            Route route = routeRepository.findByAmbulanceIdAndHospitalIdAndIsActiveTrue(ambulance.getId(), hospital.getId())
                    .orElseGet(() -> {
                        Route r = new Route();
                        r.setAmbulance(ambulance);
                        r.setHospital(hospital);
                        r.setTrafficMultiplier(1.0);
                        r.setIsActive(true);
                        return r;
                    });

            int baseDuration = (int) Math.round((distanceKm / 45.0) * 3600.0);
            route.setDistanceKm(distanceKm);
            route.setBaseDurationSeconds(baseDuration);
            int newEta = haversineRouter.calculateEtaSeconds(distanceKm, speed, route.getTrafficMultiplier());

            int oldEta = route.getCalculatedEtaSeconds() != null ? route.getCalculatedEtaSeconds() : newEta;
            route.setCalculatedEtaSeconds(newEta);
            routeRepository.save(route);

            // Check if ETA changed materially (> 180 seconds)
            if (Math.abs(newEta - oldEta) >= 180) {
                reevaluationService.triggerEtaReevaluation(ambulance.getId(), hospital.getId(), newEta);
            }
        }
    }

    @Transactional
    public void updateTraffic(Long ambulanceId, double trafficMultiplier) {
        List<Route> routes = routeRepository.findByAmbulanceIdAndIsActiveTrue(ambulanceId);
        for (Route route : routes) {
            route.setTrafficMultiplier(trafficMultiplier);
            int newEta = (int) Math.round(route.getBaseDurationSeconds() * trafficMultiplier);
            route.setCalculatedEtaSeconds(newEta);
            routeRepository.save(route);
        }

        // Broadcast traffic change
        webSocketService.broadcastTrafficChange(ambulanceId, trafficMultiplier);

        // Trigger continuous reevaluation due to traffic change
        reevaluationService.triggerTrafficReevaluation(ambulanceId, trafficMultiplier);
    }

    @Transactional(readOnly = true)
    public TransportDtos.AmbulanceStateDto getLatestState(Long ambulanceId) {
        return stateRepository.findFirstByAmbulanceIdOrderByTimestampDesc(ambulanceId)
                .map(this::mapStateToDto)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<TransportDtos.RouteDto> getActiveRoutes(Long ambulanceId) {
        return routeRepository.findByAmbulanceIdAndIsActiveTrue(ambulanceId).stream()
                .map(this::mapRouteToDto)
                .collect(Collectors.toList());
    }

    public TransportDtos.AmbulanceStateDto mapStateToDto(AmbulanceState s) {
        TransportDtos.AmbulanceStateDto dto = new TransportDtos.AmbulanceStateDto();
        dto.setAmbulanceId(s.getAmbulance().getId());
        dto.setCaseId(s.getCaseId());
        dto.setLatitude(s.getLatitude());
        dto.setLongitude(s.getLongitude());
        dto.setHeading(s.getHeading());
        dto.setSpeedKmh(s.getSpeedKmh());
        dto.setCabinTemperature(s.getCabinTemperature());
        dto.setHumidity(s.getHumidity());
        dto.setOxygenSupplyPct(s.getOxygenSupplyPct());
        dto.setEdgeBatteryPct(s.getEdgeBatteryPct());
        dto.setPowerState(s.getPowerState());
        dto.setNetworkSignal(s.getNetworkSignal());
        dto.setNetworkLatencyMs(s.getNetworkLatencyMs());
        dto.setPacketLossPct(s.getPacketLossPct());
        dto.setConnectivity(s.getConnectivity());
        dto.setTimestamp(s.getTimestamp());
        dto.setCorrelationId(s.getCorrelationId());
        return dto;
    }

    public TransportDtos.RouteDto mapRouteToDto(Route r) {
        TransportDtos.RouteDto dto = new TransportDtos.RouteDto();
        dto.setId(r.getId());
        dto.setAmbulanceId(r.getAmbulance().getId());
        dto.setHospitalId(r.getHospital().getId());
        dto.setHospitalName(r.getHospital().getName());
        dto.setHospitalCode(r.getHospital().getHospitalCode());
        dto.setDistanceKm(r.getDistanceKm());
        dto.setBaseDurationSeconds(r.getBaseDurationSeconds());
        dto.setTrafficMultiplier(r.getTrafficMultiplier());
        dto.setCalculatedEtaSeconds(r.getCalculatedEtaSeconds());
        dto.setWaypointsJson(r.getWaypointsJson());
        return dto;
    }
}
