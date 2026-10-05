package com.lifeflow.simulation;

import com.lifeflow.ambulance.Ambulance;
import com.lifeflow.ambulance.AmbulanceRepository;
import com.lifeflow.decision.DestinationDecisionEngine;
import com.lifeflow.decision.Recommendation;
import com.lifeflow.hospital.Hospital;
import com.lifeflow.hospital.HospitalRepository;
import com.lifeflow.hospital.HospitalResource;
import com.lifeflow.hospital.HospitalResourceRepository;
import com.lifeflow.hospital.HospitalService;
import com.lifeflow.patient.*;
import com.lifeflow.transport.AmbulanceState;
import com.lifeflow.transport.AmbulanceStateRepository;
import com.lifeflow.transport.TransportDtos;
import com.lifeflow.transport.TransportService;
import com.lifeflow.twin.PatientTwinService;
import com.lifeflow.websocket.WebSocketMessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class SimulationService {

    private static final Logger log = LoggerFactory.getLogger(SimulationService.class);

    private final AmbulanceRepository ambulanceRepository;
    private final PatientCaseRepository caseRepository;
    private final HospitalRepository hospitalRepository;
    private final HospitalResourceRepository resourceRepository;
    private final HospitalService hospitalService;
    private final PatientTwinService patientTwinService;
    private final TransportService transportService;
    private final DestinationDecisionEngine decisionEngine;
    private final WebSocketMessageService webSocketService;

    private boolean running = false;
    private String currentScenario = "GOLDEN_HOUR";
    private double simulationSpeed = 1.0;
    private int stepCounter = 0;
    private String activeCaseId = "CASE-2026-001";
    private Long activeAmbulanceId = 1L;

    // Trajectory coordinates (simulated urban path moving towards candidate hospitals)
    private final double[][] routeWaypoints = {
            {37.7749, -122.4194},
            {37.7765, -122.4178},
            {37.7782, -122.4160},
            {37.7801, -122.4141},
            {37.7820, -122.4120},
            {37.7845, -122.4095},
            {37.7870, -122.4070},
            {37.7895, -122.4045},
            {37.7920, -122.4020},
            {37.7950, -122.3990}
    };

    public SimulationService(AmbulanceRepository ambulanceRepository,
                             PatientCaseRepository caseRepository,
                             HospitalRepository hospitalRepository,
                             HospitalResourceRepository resourceRepository,
                             HospitalService hospitalService,
                             PatientTwinService patientTwinService,
                             TransportService transportService,
                             @Lazy DestinationDecisionEngine decisionEngine,
                             WebSocketMessageService webSocketService) {
        this.ambulanceRepository = ambulanceRepository;
        this.caseRepository = caseRepository;
        this.hospitalRepository = hospitalRepository;
        this.resourceRepository = resourceRepository;
        this.hospitalService = hospitalService;
        this.patientTwinService = patientTwinService;
        this.transportService = transportService;
        this.decisionEngine = decisionEngine;
        this.webSocketService = webSocketService;
    }

    @Transactional
    public Map<String, Object> startGoldenHourScenario() {
        log.info("Starting Golden Hour Dynamic Destination Scenario...");
        resetScenario();

        // 1. Ensure initial hospitals exist
        ensureSeedHospitals();

        // 2. Ensure active ambulance exists
        Ambulance ambulance = ambulanceRepository.findAll().stream().findFirst().orElseGet(() -> {
            Ambulance amb = new Ambulance("MED-UNIT-101", "Medic-1", "Mercedes Sprinter Type III", "Downtown Station 1");
            amb.setStatus("EN_ROUTE_SCENE");
            return ambulanceRepository.save(amb);
        });
        activeAmbulanceId = ambulance.getId();

        // 3. Ensure active patient case exists
        activeCaseId = "CASE-2026-001";
        PatientCase patientCase = caseRepository.findByCaseId(activeCaseId).orElseGet(() -> {
            PatientCase pc = new PatientCase(activeCaseId, ambulance, "PT-7749-DOE", 52, "M",
                    "Severe blunt chest trauma, motor vehicle collision", "RED");
            return caseRepository.saveAndFlush(pc);
        });

        // 4. Initial baseline vitals: HR=110, SpO2=95%, BP=110/70, RR=22
        String corrId = UUID.randomUUID().toString();
        patientTwinService.updateTwinFromTelemetry(activeCaseId, "HEART_RATE", 110.0, "GOOD", corrId);
        patientTwinService.updateTwinFromTelemetry(activeCaseId, "SPO2", 95.0, "GOOD", corrId);
        patientTwinService.updateTwinFromTelemetry(activeCaseId, "SYSTOLIC_BP", 110.0, "GOOD", corrId);
        patientTwinService.updateTwinFromTelemetry(activeCaseId, "DIASTOLIC_BP", 70.0, "GOOD", corrId);
        patientTwinService.updateTwinFromTelemetry(activeCaseId, "MAP", 83.3, "GOOD", corrId);
        patientTwinService.updateTwinFromTelemetry(activeCaseId, "RESPIRATORY_RATE", 22.0, "GOOD", corrId);
        patientTwinService.updateTwinFromTelemetry(activeCaseId, "TEMPERATURE", 37.0, "GOOD", corrId);
        patientTwinService.updateTwinFromTelemetry(activeCaseId, "ETCO2", 36.0, "GOOD", corrId);
        patientTwinService.updateTwinFromTelemetry(activeCaseId, "GLUCOSE", 110.0, "GOOD", corrId);

        // 5. Initial GPS position
        TransportDtos.UpdateGpsRequest gpsReq = new TransportDtos.UpdateGpsRequest();
        gpsReq.setAmbulanceId(ambulance.getId());
        gpsReq.setCaseId(activeCaseId);
        gpsReq.setLatitude(routeWaypoints[0][0]);
        gpsReq.setLongitude(routeWaypoints[0][1]);
        gpsReq.setHeading(45.0);
        gpsReq.setSpeedKmh(48.0);
        transportService.updateGpsLocation(gpsReq, corrId);

        // 6. Run initial destination evaluation
        Recommendation initialRecom = decisionEngine.evaluateDestinations(activeCaseId, corrId);

        this.running = true;
        this.stepCounter = 0;
        this.currentScenario = "GOLDEN_HOUR";

        Map<String, Object> result = new HashMap<>();
        result.put("status", "STARTED");
        result.put("scenario", currentScenario);
        result.put("caseId", activeCaseId);
        result.put("ambulanceId", ambulance.getId());
        result.put("recommendation", decisionEngine.mapToDto(initialRecom));
        return result;
    }

    @Transactional
    public void triggerPatientDeterioration() {
        log.warn("SIMULATION TRIGGER: Patient Deterioration Initiated!");
        String corrId = UUID.randomUUID().toString();
        // Acute deterioration: SpO2 drops to 88%, HR spikes to 131, RR increases to 32
        patientTwinService.updateTwinFromTelemetry(activeCaseId, "SPO2", 88.0, "GOOD", corrId);
        patientTwinService.updateTwinFromTelemetry(activeCaseId, "HEART_RATE", 131.0, "GOOD", corrId);
        patientTwinService.updateTwinFromTelemetry(activeCaseId, "RESPIRATORY_RATE", 32.0, "GOOD", corrId);
        patientTwinService.updateTwinFromTelemetry(activeCaseId, "SYSTOLIC_BP", 90.0, "GOOD", corrId);
        patientTwinService.updateTwinFromTelemetry(activeCaseId, "DIASTOLIC_BP", 55.0, "GOOD", corrId);
        patientTwinService.updateTwinFromTelemetry(activeCaseId, "MAP", 66.7, "GOOD", corrId);
    }

    @Transactional
    public void triggerTrafficChange(double multiplier) {
        log.warn("SIMULATION TRIGGER: Traffic congestion surge ({}x)!", multiplier);
        transportService.updateTraffic(activeAmbulanceId, multiplier);
    }

    @Transactional
    public void triggerHospitalResourceChange(String hospitalCode, String resourceType, int count) {
        log.warn("SIMULATION TRIGGER: Hospital {} resource {} changed to {}!", hospitalCode, resourceType, count);
        hospitalRepository.findByHospitalCode(hospitalCode).ifPresent(h -> {
            hospitalService.updateResource(h.getId(), resourceType, count);
        });
    }

    @Scheduled(fixedRate = 3000)
    public void simulationTick() {
        if (!running) return;

        stepCounter++;
        int waypointIdx = (stepCounter % routeWaypoints.length);
        double lat = routeWaypoints[waypointIdx][0];
        double lon = routeWaypoints[waypointIdx][1];

        TransportDtos.UpdateGpsRequest gpsReq = new TransportDtos.UpdateGpsRequest();
        gpsReq.setAmbulanceId(activeAmbulanceId);
        gpsReq.setCaseId(activeCaseId);
        gpsReq.setLatitude(lat);
        gpsReq.setLongitude(lon);
        gpsReq.setHeading(waypointIdx * 15.0);
        gpsReq.setSpeedKmh(45.0 + (stepCounter % 10));
        transportService.updateGpsLocation(gpsReq, UUID.randomUUID().toString());

        // Broadcast simulation heartbeat
        Map<String, Object> status = new HashMap<>();
        status.put("running", running);
        status.put("scenario", currentScenario);
        status.put("speed", simulationSpeed);
        status.put("step", stepCounter);
        webSocketService.broadcastSimulationStatus(status);
    }

    public void pause() { this.running = false; }
    public void resume() { this.running = true; }
    public void resetScenario() {
        this.running = false;
        this.stepCounter = 0;
    }

    public void setSpeed(double speed) { this.simulationSpeed = speed; }

    public Map<String, Object> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("running", running);
        status.put("scenario", currentScenario);
        status.put("speed", simulationSpeed);
        status.put("step", stepCounter);
        status.put("activeCaseId", activeCaseId);
        return status;
    }

    @Transactional
    public void ensureSeedHospitals() {
        if (hospitalRepository.count() >= 5) return;

        // 1. St. Jude Central Hospital (Level 1 Trauma, full capability, 12 km)
        Hospital h1 = createHospIfAbsent("HOSP-001", "St. Jude Central Hospital", "100 Memorial Way, Metro City",
                37.8044, -122.2712, "LEVEL_1", true, true, true, true, true);
        seedResources(h1, 4, 15, 6, 12, 2, 2, 50, 4, 3, 5);

        // 2. Metro General Hospital (Level 2 Trauma, medium ICU, 8 km)
        Hospital h2 = createHospIfAbsent("HOSP-002", "Metro General Hospital", "500 Civic Center Blvd",
                37.7885, -122.4074, "LEVEL_2", true, true, false, false, true);
        seedResources(h2, 2, 8, 3, 6, 1, 1, 20, 2, 2, 2);

        // 3. Westside Community Hospital (Emergency center, closest, 3.5 km)
        Hospital h3 = createHospIfAbsent("HOSP-003", "Westside Community Hospital", "780 Sunset Ave",
                37.7650, -122.4600, "LEVEL_3", false, false, false, false, false);
        seedResources(h3, 1, 6, 1, 2, 1, 0, 10, 0, 0, 1);

        // 4. Hope Valley Medical Center (Neuro & Cardiac, 9.5 km)
        Hospital h4 = createHospIfAbsent("HOSP-004", "Hope Valley Medical Center", "320 Skyline Dr",
                37.7320, -122.4450, "LEVEL_2", true, true, false, false, false);
        seedResources(h4, 2, 10, 2, 5, 1, 1, 25, 3, 3, 1);

        // 5. Northshore Emergency Clinic (Urgent trauma, 14 km)
        Hospital h5 = createHospIfAbsent("HOSP-005", "Northshore Emergency Clinic", "1200 Bayview St",
                37.8250, -122.4200, "LEVEL_4", false, false, false, false, false);
        seedResources(h5, 0, 4, 0, 1, 0, 0, 5, 0, 0, 0);

        log.info("Initialized 5 regional candidate hospitals and medical resources.");
    }

    private Hospital createHospIfAbsent(String code, String name, String address, double lat, double lon,
                                       String trauma, boolean cath, boolean stroke, boolean peds, boolean burn, boolean heli) {
        return hospitalRepository.findByHospitalCode(code).orElseGet(() -> {
            Hospital h = new Hospital(code, name, address, lat, lon, trauma, cath, stroke);
            h.setHasPediatricIcu(peds);
            h.setHasBurnUnit(burn);
            h.setHasHelipad(heli);
            h.setContactPhone("+1-555-0199");
            return hospitalRepository.save(h);
        });
    }

    private void seedResources(Hospital h, int icu, int ed, int ot, int vent, int ct, int mri, int blood, int card, int neur, int traum) {
        saveRes(h, "ICU_BEDS", 10, icu);
        saveRes(h, "ED_BEDS", 30, ed);
        saveRes(h, "OT_THEATRES", 8, ot);
        saveRes(h, "VENTILATORS", 15, vent);
        saveRes(h, "CT_SCANNERS", 2, ct);
        saveRes(h, "MRI_SCANNERS", 2, mri);
        saveRes(h, "BLOOD_BANK_UNITS", 100, blood);
        saveRes(h, "CARDIOLOGIST", 5, card);
        saveRes(h, "NEUROLOGIST", 4, neur);
        saveRes(h, "TRAUMA_SURGEON", 6, traum);
        hospitalService.updateHospitalTwinState(h);
    }

    private void saveRes(Hospital h, String type, int cap, int avail) {
        resourceRepository.findByHospitalIdAndResourceType(h.getId(), type).orElseGet(() -> {
            HospitalResource r = new HospitalResource(h, type, cap, avail, 300);
            return resourceRepository.save(r);
        });
    }
}
