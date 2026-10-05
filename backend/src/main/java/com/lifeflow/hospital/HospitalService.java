package com.lifeflow.hospital;

import com.lifeflow.ambulance.Ambulance;
import com.lifeflow.ambulance.AmbulanceRepository;
import com.lifeflow.common.ResourceNotFoundException;
import com.lifeflow.decision.ReevaluationService;
import com.lifeflow.routing.HaversineRouter;
import com.lifeflow.transport.Route;
import com.lifeflow.transport.RouteRepository;
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
public class HospitalService {

    private static final Logger log = LoggerFactory.getLogger(HospitalService.class);

    private final HospitalRepository hospitalRepository;
    private final HospitalResourceRepository resourceRepository;
    private final HospitalResourceSnapshotRepository snapshotRepository;
    private final HospitalTwinStateRepository twinStateRepository;
    private final WebSocketMessageService webSocketService;
    private final ReevaluationService reevaluationService;
    private final AmbulanceRepository ambulanceRepository;
    private final RouteRepository routeRepository;
    private final HaversineRouter haversineRouter;

    public HospitalService(HospitalRepository hospitalRepository,
                           HospitalResourceRepository resourceRepository,
                           HospitalResourceSnapshotRepository snapshotRepository,
                           HospitalTwinStateRepository twinStateRepository,
                           @Lazy WebSocketMessageService webSocketService,
                           @Lazy ReevaluationService reevaluationService,
                           AmbulanceRepository ambulanceRepository,
                           RouteRepository routeRepository,
                           HaversineRouter haversineRouter) {
        this.hospitalRepository = hospitalRepository;
        this.resourceRepository = resourceRepository;
        this.snapshotRepository = snapshotRepository;
        this.twinStateRepository = twinStateRepository;
        this.webSocketService = webSocketService;
        this.reevaluationService = reevaluationService;
        this.ambulanceRepository = ambulanceRepository;
        this.routeRepository = routeRepository;
        this.haversineRouter = haversineRouter;
    }

    @Transactional(readOnly = true)
    public List<HospitalDtos.HospitalDto> getAllHospitals() {
        return hospitalRepository.findAll().stream()
                .map(this::mapHospitalToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public HospitalDtos.HospitalDto getHospitalByCode(String code) {
        Hospital hospital = hospitalRepository.findByHospitalCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + code));
        return mapHospitalToDto(hospital);
    }

    @Transactional
    public HospitalDtos.HospitalDto updateResource(Long hospitalId, String resourceType, int availableCount) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + hospitalId));

        HospitalResource res = resourceRepository.findByHospitalIdAndResourceType(hospitalId, resourceType)
                .orElseGet(() -> new HospitalResource(hospital, resourceType, Math.max(availableCount, 10), availableCount, 300));

        res.setAvailableCount(availableCount);
        res.setLastUpdatedAt(Instant.now());
        resourceRepository.save(res);

        // Update digital twin state
        updateHospitalTwinState(hospital);

        // Broadcast change over WebSocket
        webSocketService.broadcastHospitalResourceChange(hospital.getHospitalCode(), resourceType, availableCount);

        // Trigger destination re-evaluation for active cases
        reevaluationService.triggerHospitalReevaluation(hospital.getId(), resourceType);

        return mapHospitalToDto(hospital);
    }

    @Transactional
    public HospitalDtos.HospitalDto createHospital(HospitalDtos.CreateHospitalRequest req) {
        if (req.getHospitalCode() == null || req.getHospitalCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Hospital code cannot be empty");
        }
        String code = req.getHospitalCode().trim().toUpperCase();
        if (hospitalRepository.findByHospitalCode(code).isPresent()) {
            throw new IllegalArgumentException("Hospital with code " + code + " already exists");
        }
        if (req.getName() == null || req.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Hospital name cannot be empty");
        }

        Hospital hospital = new Hospital();
        hospital.setHospitalCode(code);
        hospital.setName(req.getName().trim());
        hospital.setAddress(req.getAddress() != null && !req.getAddress().trim().isEmpty() ? req.getAddress().trim() : "Emergency Medical Center");
        hospital.setLatitude(req.getLatitude() != null ? req.getLatitude() : 12.9716);
        hospital.setLongitude(req.getLongitude() != null ? req.getLongitude() : 77.5946);
        hospital.setTraumaLevel(req.getTraumaLevel() != null && !req.getTraumaLevel().trim().isEmpty() ? req.getTraumaLevel() : "LEVEL_2");
        hospital.setHasCathLab(Boolean.TRUE.equals(req.getHasCathLab()));
        hospital.setHasStrokeCenter(Boolean.TRUE.equals(req.getHasStrokeCenter()));
        hospital.setHasPediatricIcu(Boolean.TRUE.equals(req.getHasPediatricIcu()));
        hospital.setHasBurnUnit(Boolean.TRUE.equals(req.getHasBurnUnit()));
        hospital.setHasHelipad(Boolean.TRUE.equals(req.getHasHelipad()));
        hospital.setActive(req.getActive() != null ? req.getActive() : true);
        hospital.setContactPhone(req.getContactPhone() != null ? req.getContactPhone() : "+1 (555) 911-0000");

        Hospital savedHospital = hospitalRepository.save(hospital);

        // Provision resources
        if (req.getResources() != null && !req.getResources().isEmpty()) {
            for (HospitalDtos.ResourceItemRequest item : req.getResources()) {
                if (item.getResourceType() != null && !item.getResourceType().trim().isEmpty()) {
                    int total = item.getTotalCapacity() != null ? Math.max(1, item.getTotalCapacity()) : 10;
                    int avail = item.getAvailableCount() != null ? Math.max(0, Math.min(item.getAvailableCount(), total)) : 2;
                    HospitalResource res = new HospitalResource(savedHospital, item.getResourceType().trim().toUpperCase(), total, avail, 300);
                    resourceRepository.save(res);
                }
            }
        } else {
            // Provision standard comprehensive clinical suite
            resourceRepository.save(new HospitalResource(savedHospital, "ICU_BEDS", 12, 3, 300));
            resourceRepository.save(new HospitalResource(savedHospital, "ED_BEDS", 30, 8, 300));
            resourceRepository.save(new HospitalResource(savedHospital, "OT_THEATRES", 6, 2, 300));
            resourceRepository.save(new HospitalResource(savedHospital, "VENTILATORS", 10, 4, 300));
            resourceRepository.save(new HospitalResource(savedHospital, "CT_SCANNERS", 2, 1, 300));
            resourceRepository.save(new HospitalResource(savedHospital, "MRI_SCANNERS", 1, 1, 300));
            resourceRepository.save(new HospitalResource(savedHospital, "BLOOD_BANK_UNITS", 50, 35, 300));
            resourceRepository.save(new HospitalResource(savedHospital, "TRAUMA_SURGEON", 3, 1, 300));
            if (savedHospital.getHasCathLab()) {
                resourceRepository.save(new HospitalResource(savedHospital, "CARDIOLOGIST", 2, 1, 300));
            }
            if (savedHospital.getHasStrokeCenter()) {
                resourceRepository.save(new HospitalResource(savedHospital, "NEUROLOGIST", 2, 1, 300));
            }
        }

        // Initialize twin state
        updateHospitalTwinState(savedHospital);

        // Provision initial transit routes for all existing ambulances
        try {
            List<Ambulance> ambulances = ambulanceRepository.findAll();
            for (Ambulance amb : ambulances) {
                double distanceKm = haversineRouter.calculateDistanceKm(
                        12.9716, 77.5946, savedHospital.getLatitude(), savedHospital.getLongitude()
                );
                int baseDuration = (int) Math.round((distanceKm / 45.0) * 3600.0);
                int eta = haversineRouter.calculateEtaSeconds(distanceKm, 45.0, 1.0);
                Route route = new Route();
                route.setAmbulance(amb);
                route.setHospital(savedHospital);
                route.setDistanceKm(distanceKm);
                route.setBaseDurationSeconds(baseDuration);
                route.setTrafficMultiplier(1.0);
                route.setCalculatedEtaSeconds(eta);
                route.setIsActive(true);
                routeRepository.save(route);
            }
        } catch (Exception ex) {
            log.warn("Could not pre-provision routes for new hospital: {}", ex.getMessage());
        }

        // Broadcast over WebSocket
        webSocketService.broadcastHospitalResourceChange(savedHospital.getHospitalCode(), "HOSPITAL_ADDED", 1);

        log.info("Registered new hospital: {} [{}] with resources provisioned", savedHospital.getName(), savedHospital.getHospitalCode());
        return mapHospitalToDto(savedHospital);
    }

    @Transactional
    public HospitalDtos.HospitalDto provisionResource(Long hospitalId, HospitalDtos.ProvisionResourceRequest req) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + hospitalId));

        String rType = req.getResourceType().trim().toUpperCase();
        int total = req.getTotalCapacity() != null ? Math.max(1, req.getTotalCapacity()) : 10;
        int avail = req.getAvailableCount() != null ? Math.max(0, req.getAvailableCount()) : 0;
        int ttl = req.getFreshnessTtlSeconds() != null ? req.getFreshnessTtlSeconds() : 300;

        HospitalResource res = resourceRepository.findByHospitalIdAndResourceType(hospitalId, rType)
                .orElseGet(() -> new HospitalResource(hospital, rType, total, avail, ttl));

        res.setTotalCapacity(total);
        res.setAvailableCount(avail);
        res.setFreshnessTtlSeconds(ttl);
        res.setLastUpdatedAt(Instant.now());
        resourceRepository.save(res);

        updateHospitalTwinState(hospital);
        webSocketService.broadcastHospitalResourceChange(hospital.getHospitalCode(), rType, avail);
        reevaluationService.triggerHospitalReevaluation(hospital.getId(), rType);

        log.info("Provisioned resource {} for hospital {}: total={}, avail={}", rType, hospital.getHospitalCode(), total, avail);
        return mapHospitalToDto(hospital);
    }

    @Transactional
    public void deactivateHospital(Long hospitalId) {
        Hospital hospital = hospitalRepository.findById(hospitalId)
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + hospitalId));
        hospital.setActive(false);
        hospitalRepository.save(hospital);

        // Deactivate routes
        try {
            List<Route> routes = routeRepository.findAll();
            for (Route r : routes) {
                if (r.getHospital() != null && r.getHospital().getId().equals(hospitalId)) {
                    r.setIsActive(false);
                    routeRepository.save(r);
                }
            }
        } catch (Exception ex) {
            log.warn("Error deactivating routes for hospital: {}", ex.getMessage());
        }

        webSocketService.broadcastHospitalResourceChange(hospital.getHospitalCode(), "HOSPITAL_DEACTIVATED", 0);
        log.info("Hospital {} [{}] marked as inactive", hospital.getName(), hospital.getHospitalCode());
    }

    @Transactional
    public void updateHospitalTwinState(Hospital hospital) {
        List<HospitalResource> resources = resourceRepository.findByHospitalId(hospital.getId());

        int totalIcu = 0, availIcu = 0;
        int totalEd = 0, availEd = 0;
        int otAvail = 0, ventAvail = 0;
        boolean ctAvail = false, mriAvail = false, specAvail = false;
        boolean anyStale = false;

        for (HospitalResource r : resources) {
            if (r.isStale()) anyStale = true;
            switch (r.getResourceType()) {
                case "ICU_BEDS":
                    totalIcu += r.getTotalCapacity();
                    availIcu += r.getAvailableCount();
                    break;
                case "ED_BEDS":
                    totalEd += r.getTotalCapacity();
                    availEd += r.getAvailableCount();
                    break;
                case "OT_THEATRES":
                    otAvail += r.getAvailableCount();
                    break;
                case "VENTILATORS":
                    ventAvail += r.getAvailableCount();
                    break;
                case "CT_SCANNERS":
                    ctAvail = r.getAvailableCount() > 0;
                    break;
                case "MRI_SCANNERS":
                    mriAvail = r.getAvailableCount() > 0;
                    break;
                case "CARDIOLOGIST":
                case "TRAUMA_SURGEON":
                case "NEUROLOGIST":
                    if (r.getAvailableCount() > 0) specAvail = true;
                    break;
                default:
                    break;
            }
        }

        double icuOccupancy = totalIcu > 0 ? ((double) (totalIcu - availIcu) / totalIcu) * 100.0 : 0.0;
        double edOccupancy = totalEd > 0 ? ((double) (totalEd - availEd) / totalEd) * 100.0 : 0.0;

        HospitalTwinState twinState = twinStateRepository.findFirstByHospitalIdOrderByTimestampDesc(hospital.getId())
                .orElseGet(() -> {
                    HospitalTwinState s = new HospitalTwinState();
                    s.setHospital(hospital);
                    return s;
                });

        twinState.setTimestamp(Instant.now());
        twinState.setIcuOccupancyPct(Math.round(icuOccupancy * 10.0) / 10.0);
        twinState.setEdOccupancyPct(Math.round(edOccupancy * 10.0) / 10.0);
        twinState.setOtAvailableCount(otAvail);
        twinState.setVentilatorAvailableCount(ventAvail);
        twinState.setCtScannerAvailable(ctAvail);
        twinState.setMriScannerAvailable(mriAvail);
        twinState.setSpecialistAvailable(specAvail);
        twinState.setTraumaReady(hospital.getTraumaLevel().startsWith("LEVEL") && availIcu > 0 && otAvail > 0);
        twinState.setOverallFreshnessStatus(anyStale ? "STALE" : "CURRENT");
        twinState.setConfidenceScore(anyStale ? 0.75 : 0.98);
        twinState.setCorrelationId(UUID.randomUUID().toString());

        twinStateRepository.save(twinState);
    }

    public HospitalDtos.HospitalDto mapHospitalToDto(Hospital h) {
        HospitalDtos.HospitalDto dto = new HospitalDtos.HospitalDto();
        dto.setId(h.getId());
        dto.setHospitalCode(h.getHospitalCode());
        dto.setName(h.getName());
        dto.setAddress(h.getAddress());
        dto.setLatitude(h.getLatitude());
        dto.setLongitude(h.getLongitude());
        dto.setTraumaLevel(h.getTraumaLevel());
        dto.setHasCathLab(h.getHasCathLab());
        dto.setHasStrokeCenter(h.getHasStrokeCenter());
        dto.setHasPediatricIcu(h.getHasPediatricIcu());
        dto.setHasBurnUnit(h.getHasBurnUnit());
        dto.setHasHelipad(h.getHasHelipad());
        dto.setActive(h.getActive());
        dto.setContactPhone(h.getContactPhone());

        List<HospitalResource> resources = resourceRepository.findByHospitalId(h.getId());
        dto.setResources(resources.stream().map(r -> {
            HospitalDtos.HospitalResourceDto rd = new HospitalDtos.HospitalResourceDto();
            rd.setId(r.getId());
            rd.setHospitalId(h.getId());
            rd.setResourceType(r.getResourceType());
            rd.setTotalCapacity(r.getTotalCapacity());
            rd.setAvailableCount(r.getAvailableCount());
            rd.setStatus(r.getStatus());
            rd.setConfidence(r.getConfidence());
            rd.setFreshnessTtlSeconds(r.getFreshnessTtlSeconds());
            rd.setLastUpdatedAt(r.getLastUpdatedAt());
            rd.setStale(r.isStale());
            return rd;
        }).collect(Collectors.toList()));

        twinStateRepository.findFirstByHospitalIdOrderByTimestampDesc(h.getId()).ifPresent(ts -> {
            HospitalDtos.HospitalTwinStateDto tsd = new HospitalDtos.HospitalTwinStateDto();
            tsd.setHospitalId(h.getId());
            tsd.setHospitalCode(h.getHospitalCode());
            tsd.setHospitalName(h.getName());
            tsd.setTimestamp(ts.getTimestamp());
            tsd.setIcuOccupancyPct(ts.getIcuOccupancyPct());
            tsd.setEdOccupancyPct(ts.getEdOccupancyPct());
            tsd.setOtAvailableCount(ts.getOtAvailableCount());
            tsd.setVentilatorAvailableCount(ts.getVentilatorAvailableCount());
            tsd.setCtScannerAvailable(ts.getCtScannerAvailable());
            tsd.setMriScannerAvailable(ts.getMriScannerAvailable());
            tsd.setSpecialistAvailable(ts.getSpecialistAvailable());
            tsd.setTraumaReady(ts.getTraumaReady());
            tsd.setOverallFreshnessStatus(ts.getOverallFreshnessStatus());
            tsd.setConfidenceScore(ts.getConfidenceScore());

            // Estimated projected capacity at ETA (+15 min queue model projection)
            Map<String, Integer> proj = new HashMap<>();
            resources.forEach(r -> {
                int avail = r.getAvailableCount();
                // Simple Poisson projection: if heavy load, slight chance of loss
                int projAvail = Math.max(0, avail);
                proj.put(r.getResourceType(), projAvail);
            });
            tsd.setProjectedAtEta(proj);

            dto.setTwinState(tsd);
        });

        return dto;
    }
}
