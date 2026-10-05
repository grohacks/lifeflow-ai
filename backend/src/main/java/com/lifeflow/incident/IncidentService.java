package com.lifeflow.incident;

import com.lifeflow.ambulance.Ambulance;
import com.lifeflow.ambulance.AmbulanceRepository;
import com.lifeflow.common.ResourceNotFoundException;
import com.lifeflow.patient.PatientCase;
import com.lifeflow.patient.PatientCaseRepository;
import com.lifeflow.routing.HaversineRouter;
import com.lifeflow.transport.AmbulanceState;
import com.lifeflow.transport.AmbulanceStateRepository;
import com.lifeflow.websocket.WebSocketMessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class IncidentService {

    private static final Logger log = LoggerFactory.getLogger(IncidentService.class);

    private final IncidentRepository incidentRepository;
    private final AmbulanceRepository ambulanceRepository;
    private final AmbulanceStateRepository ambulanceStateRepository;
    private final PatientCaseRepository patientCaseRepository;
    private final com.lifeflow.patient.PatientTwinStateRepository twinStateRepository;
    private final HaversineRouter haversineRouter;
    private final WebSocketMessageService webSocketMessageService;
    private final com.lifeflow.patient.PatientService patientService;

    public IncidentService(IncidentRepository incidentRepository,
                           AmbulanceRepository ambulanceRepository,
                           AmbulanceStateRepository ambulanceStateRepository,
                           PatientCaseRepository patientCaseRepository,
                           com.lifeflow.patient.PatientTwinStateRepository twinStateRepository,
                           HaversineRouter haversineRouter,
                           WebSocketMessageService webSocketMessageService,
                           @org.springframework.context.annotation.Lazy com.lifeflow.patient.PatientService patientService) {
        this.incidentRepository = incidentRepository;
        this.ambulanceRepository = ambulanceRepository;
        this.ambulanceStateRepository = ambulanceStateRepository;
        this.patientCaseRepository = patientCaseRepository;
        this.twinStateRepository = twinStateRepository;
        this.haversineRouter = haversineRouter;
        this.webSocketMessageService = webSocketMessageService;
        this.patientService = patientService;
    }

    @Transactional
    public IncidentDtos.IncidentDto reportCitizenSos(IncidentDtos.SosReportRequest request) {
        String code = "INC-" + System.currentTimeMillis() % 1000000;

        EmergencyIncident incident = new EmergencyIncident();
        incident.setIncidentCode(code);
        incident.setBystanderName(request.getBystanderName() != null ? request.getBystanderName() : "Anonymous Citizen");
        incident.setBystanderPhone(request.getBystanderPhone() != null ? request.getBystanderPhone() : "N/A");
        incident.setIncidentType(request.getIncidentType() != null ? request.getIncidentType() : "ROAD_ACCIDENT");
        incident.setSeverity(request.getSeverity() != null ? request.getSeverity() : "CRITICAL");
        incident.setCasualtyCount(request.getCasualtyCount() != null ? request.getCasualtyCount() : 1);
        incident.setDescription(request.getDescription() != null ? request.getDescription() : "Emergency accident reported by bystander");
        incident.setLatitude(request.getLatitude() != null ? request.getLatitude() : 12.9716);
        incident.setLongitude(request.getLongitude() != null ? request.getLongitude() : 77.5946);
        incident.setLocationAddress(request.getLocationAddress() != null ? request.getLocationAddress() : "GPS Location Pin");
        incident.setPhotoUrl(request.getPhotoUrl());

        // Find nearest available ambulance (Default to ambulance 1 if no states)
        Long assignedAmbId = 1L;
        List<AmbulanceState> states = ambulanceStateRepository.findAll();
        if (!states.isEmpty()) {
            double minDist = Double.MAX_VALUE;
            for (AmbulanceState s : states) {
                if (s.getLatitude() != null && s.getLongitude() != null) {
                    double dist = haversineRouter.calculateDistanceKm(
                            s.getLatitude(), s.getLongitude(), incident.getLatitude(), incident.getLongitude()
                    );
                    if (dist < minDist) {
                        minDist = dist;
                        if (s.getAmbulance() != null && s.getAmbulance().getId() != null) {
                            assignedAmbId = s.getAmbulance().getId();
                        }
                    }
                }
            }
        }

        incident.setAssignedAmbulanceId(assignedAmbId);
        incident.setStatus("ASSIGNED");
        incident.setDispatchedAt(Instant.now());
        incident.setReportedAt(Instant.now());

        Ambulance amb = ambulanceRepository.findById(assignedAmbId).orElse(null);

        // 1. Immediately create a dedicated PatientCase for this citizen SOS
        String caseId = "CASE-" + (System.currentTimeMillis() % 1000000);
        incident.setPatientCaseId(caseId);

        String victimName = (request.getBystanderName() != null && !request.getBystanderName().isBlank()
                && !request.getBystanderName().equalsIgnoreCase("Anonymous Citizen")
                && !request.getBystanderName().equalsIgnoreCase("Citizen Bystander"))
                ? "Patient (rep. by " + request.getBystanderName() + ")"
                : "Emergency Patient (" + (request.getIncidentType() != null ? request.getIncidentType() : "TRAUMA") + ")";

        // Run AI Clinical Vision Analysis if photo provided
        com.lifeflow.patient.PatientService.ImageVisionAnalysis visionAnalysis = null;
        if (request.getPhotoUrl() != null && request.getPhotoUrl().contains(",")) {
            try {
                byte[] imgBytes = java.util.Base64.getDecoder().decode(request.getPhotoUrl().substring(request.getPhotoUrl().indexOf(",") + 1));
                visionAnalysis = patientService.runVisionAnalysis(imgBytes, "PATIENT_TRAUMA", request.getDescription());
            } catch (Exception ex) {
                log.warn("Could not analyze citizen SOS photo with Vision AI: {}", ex.getMessage());
            }
        }

        String complaint = request.getDescription() != null ? request.getDescription() : "Bystander Reported Emergency Trauma";
        if (visionAnalysis != null && visionAnalysis.findingSummary != null) {
            String fullDiagnosis = visionAnalysis.findingSummary + " | " + complaint;
            incident.setDescription(fullDiagnosis);
            complaint = fullDiagnosis;
        }

        String safeComplaint = complaint.length() > 240 ? complaint.substring(0, 237) + "..." : complaint;

        PatientCase pCase = new PatientCase(
                caseId,
                amb,
                victimName,
                38,
                "UNKNOWN",
                safeComplaint,
                ("CRITICAL".equalsIgnoreCase(request.getSeverity()) || (visionAnalysis != null && visionAnalysis.hr > 115)) ? "RED" : "YELLOW"
        );
        patientCaseRepository.save(pCase);

        // 2. Initialize baseline Digital Twin telemetry state for this patient
        com.lifeflow.patient.PatientTwinState twinState = new com.lifeflow.patient.PatientTwinState();
        twinState.setCaseId(caseId);
        twinState.setTimestamp(Instant.now());
        boolean isCritical = "CRITICAL".equalsIgnoreCase(request.getSeverity()) || (visionAnalysis != null && visionAnalysis.hr > 115);
        twinState.setHeartRate(visionAnalysis != null && visionAnalysis.hr > 0 ? visionAnalysis.hr : (isCritical ? 116.0 : 82.0));
        twinState.setSpo2(visionAnalysis != null && visionAnalysis.spo2 > 0 ? visionAnalysis.spo2 : (isCritical ? 91.0 : 98.0));
        twinState.setSystolicBp(visionAnalysis != null && visionAnalysis.sys > 0 ? visionAnalysis.sys : (isCritical ? 96.0 : 120.0));
        twinState.setDiastolicBp(visionAnalysis != null && visionAnalysis.dia > 0 ? visionAnalysis.dia : (isCritical ? 62.0 : 80.0));
        twinState.setMapValue((twinState.getSystolicBp() + 2 * twinState.getDiastolicBp()) / 3.0);
        twinState.setRespiratoryRate(visionAnalysis != null && visionAnalysis.rr > 0 ? visionAnalysis.rr : (isCritical ? 24.0 : 16.0));
        twinState.setTemperature(37.1);
        twinState.setEtco2(34.0);
        twinState.setGlucose(108.0);
        twinState.setConsciousness(isCritical ? "VERBAL" : "ALERT");
        twinState.setConfidence(visionAnalysis != null ? visionAnalysis.confidence : 0.96);
        twinState.setDataQuality("EXCELLENT");
        twinState.setInjuryObservations(visionAnalysis != null
                ? "AI Vision Diagnosis: " + visionAnalysis.findingSummary + " | Bystander: " + (request.getDescription() != null ? request.getDescription() : "Scene trauma reported")
                : "Citizen SOS Field Report: " + (request.getDescription() != null ? request.getDescription() : "Scene trauma reported"));
        twinState.setCorrelationId(UUID.randomUUID().toString());
        twinStateRepository.save(twinState);

        EmergencyIncident saved = incidentRepository.save(incident);

        // Broadcast citizen SOS scene photo to patient snaps stream if photo attached
        if (request.getPhotoUrl() != null && !request.getPhotoUrl().isBlank()) {
            Map<String, Object> snapPayload = new HashMap<>();
            snapPayload.put("isSnap", true);
            snapPayload.put("highResSnap", request.getPhotoUrl());
            snapPayload.put("source", "CITIZEN_SOS");
            snapPayload.put("label", "Citizen SOS Scene Photo (" + (request.getIncidentType() != null ? request.getIncidentType().replace('_', ' ') : "Incident") + ")");
            if (visionAnalysis != null) {
                snapPayload.put("aiFinding", visionAnalysis.findingSummary);
                snapPayload.put("injuryRegion", visionAnalysis.injuryRegion);
                snapPayload.put("bleedingDesc", visionAnalysis.bleedingDesc);
                snapPayload.put("confidence", visionAnalysis.confidence);
                snapPayload.put("spo2", visionAnalysis.spo2);
                snapPayload.put("heartRate", visionAnalysis.hr);
            }
            snapPayload.put("timestamp", System.currentTimeMillis());
            patientService.registerSnap(caseId, snapPayload);
            webSocketMessageService.broadcastCameraSnap(caseId, snapPayload);
        }

        // Position assigned ambulance realistically close to scene (~2.2 km away) for local dispatch demo
        if (amb != null && incident.getLatitude() != null && incident.getLongitude() != null) {
            double ambLat = incident.getLatitude() + 0.015;
            double ambLng = incident.getLongitude() + 0.012;
            AmbulanceState newState = new AmbulanceState();
            newState.setAmbulance(amb);
            newState.setLatitude(ambLat);
            newState.setLongitude(ambLng);
            newState.setSpeedKmh(48.0);
            newState.setHeading(215.0);
            newState.setConnectivity("CONNECTED");
            newState.setCorrelationId(UUID.randomUUID().toString());
            newState.setTimestamp(Instant.now());
            ambulanceStateRepository.save(newState);

            com.lifeflow.transport.TransportDtos.AmbulanceStateDto stateDto = new com.lifeflow.transport.TransportDtos.AmbulanceStateDto();
            stateDto.setAmbulanceId(amb.getId());
            stateDto.setLatitude(ambLat);
            stateDto.setLongitude(ambLng);
            stateDto.setSpeedKmh(48.0);
            stateDto.setHeading(215.0);
            stateDto.setConnectivity("CONNECTED");
            stateDto.setTimestamp(newState.getTimestamp());
            stateDto.setCorrelationId(newState.getCorrelationId());
            webSocketMessageService.broadcastAmbulanceMovement(amb.getId(), stateDto);
        }

        IncidentDtos.IncidentDto dto = mapToDto(saved);

        // Broadcast to WebSocket channel for instant audible chime and banner
        broadcastAlert(dto);
        log.info("Emergency Incident Reported & Dispatched: {} -> Assigned AMB-{}", saved.getIncidentCode(), assignedAmbId);

        return dto;
    }

    @Transactional
    public IncidentDtos.IncidentDto processSmsDispatch(IncidentDtos.SmsWebhookRequest req) {
        String body = req.getBody() != null ? req.getBody().trim() : "EMERGENCY SOS VIA SMS";
        String from = req.getFrom() != null ? req.getFrom() : "Cellular Caller";

        // Parse incident type from text
        String upper = body.toUpperCase();
        String incidentType = "ROAD_ACCIDENT";
        if (upper.contains("CARDIAC") || upper.contains("HEART") || upper.contains("CHEST")) {
            incidentType = "CARDIAC_ARREST";
        } else if (upper.contains("FALL") || upper.contains("TRAUMA") || upper.contains("FRACTURE")) {
            incidentType = "FALL_TRAUMA";
        } else if (upper.contains("BURN") || upper.contains("FIRE")) {
            incidentType = "BURNS";
        }

        // Parse casualty count
        int casualties = 1;
        java.util.regex.Matcher casMatcher = java.util.regex.Pattern.compile("(?:CASUALTIES|CASUALTY|PEOPLE|PERSONS|VICTIMS)[:\\s]+(\\d+)", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(body);
        if (casMatcher.find()) {
            try {
                casualties = Math.max(1, Integer.parseInt(casMatcher.group(1)));
            } catch (Exception ignored) {}
        } else if (upper.contains("2 ") || upper.contains("TWO") || upper.contains("2 CASUALTIES") || upper.contains("2 PEOPLE")) {
            casualties = 2;
        } else if (upper.contains("3 ") || upper.contains("THREE")) {
            casualties = 3;
        } else if (upper.contains("4 ") || upper.contains("FOUR") || upper.contains("MULTIPLE")) {
            casualties = 4;
        }

        // Coordinates: use provided or extract regex (lat: xx.xxxx, lng: xx.xxxx) or default
        Double lat = req.getLatitude();
        Double lng = req.getLongitude();
        if (lat == null || lng == null) {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("(-?\\d{1,3}\\.\\d+)[,\\s]+(-?\\d{1,3}\\.\\d+)").matcher(body);
            if (m.find()) {
                try {
                    lat = Double.parseDouble(m.group(1));
                    lng = Double.parseDouble(m.group(2));
                } catch (Exception ignored) {}
            }
        }
        if (lat == null) lat = 16.5074;
        if (lng == null) lng = 80.6466;

        IncidentDtos.SosReportRequest sos = new IncidentDtos.SosReportRequest();
        sos.setBystanderName("SMS Dispatch (" + from + ")");
        sos.setBystanderPhone(from);
        sos.setIncidentType(incidentType);
        sos.setSeverity("CRITICAL");
        sos.setCasualtyCount(casualties);
        sos.setDescription("OFFLINE 2G/SMS DISPATCH: " + body);
        sos.setLatitude(lat);
        sos.setLongitude(lng);
        sos.setLocationAddress("Cellular SMS Pin (" + String.format("%.4f", lat) + ", " + String.format("%.4f", lng) + ")");

        return reportCitizenSos(sos);
    }

    @Transactional
    public IncidentDtos.IncidentDto processCallDispatch(IncidentDtos.CallWebhookRequest req) {
        String transcript = req.getTranscript() != null ? req.getTranscript() : "Emergency Voice Call Received";
        String caller = req.getCallerPhone() != null ? req.getCallerPhone() : "Emergency Caller";
        Double lat = req.getLatitude() != null ? req.getLatitude() : 16.5074;
        Double lng = req.getLongitude() != null ? req.getLongitude() : 80.6466;

        IncidentDtos.SosReportRequest sos = new IncidentDtos.SosReportRequest();
        sos.setBystanderName("Hotline Voice Call (" + caller + ")");
        sos.setBystanderPhone(caller);
        sos.setIncidentType("ROAD_ACCIDENT");
        sos.setSeverity("CRITICAL");
        sos.setCasualtyCount(1);
        sos.setDescription("AUTOMATED VOICE CALL DISPATCH: " + transcript);
        sos.setLatitude(lat);
        sos.setLongitude(lng);
        sos.setLocationAddress(req.getCallerLocation() != null ? req.getCallerLocation() : "Cell Tower Triangulation (" + String.format("%.4f", lat) + ", " + String.format("%.4f", lng) + ")");

        return reportCitizenSos(sos);
    }

    @Transactional(readOnly = true)
    public List<IncidentDtos.IncidentDto> getActiveIncidents() {
        return incidentRepository.findByStatusInOrderByIdDesc(
                Arrays.asList("REPORTED", "ASSIGNED", "EN_ROUTE_SCENE", "ON_SCENE")
        ).stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public IncidentDtos.IncidentDto getIncidentById(Long id) {
        EmergencyIncident inc = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + id));
        return mapToDto(inc);
    }

    @Transactional
    public IncidentDtos.IncidentDto updateStatus(Long id, String status) {
        EmergencyIncident inc = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + id));

        inc.setStatus(status);
        if ("ON_SCENE".equalsIgnoreCase(status) && inc.getArrivedSceneAt() == null) {
            inc.setArrivedSceneAt(Instant.now());
        }

        EmergencyIncident saved = incidentRepository.save(inc);
        IncidentDtos.IncidentDto dto = mapToDto(saved);
        broadcastAlert(dto);
        log.info("Emergency Incident Status Updated: {} -> {}", inc.getIncidentCode(), status);
        return dto;
    }

    @Transactional
    public IncidentDtos.IncidentDto boardPatientAndStartCare(Long id) {
        EmergencyIncident inc = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + id));

        String caseId = inc.getPatientCaseId();
        if (caseId == null || caseId.isBlank()) {
            caseId = "CASE-" + (System.currentTimeMillis() % 1000000);
            inc.setPatientCaseId(caseId);

            Ambulance ambulance = ambulanceRepository.findById(inc.getAssignedAmbulanceId())
                    .orElseGet(() -> ambulanceRepository.findAll().stream().findFirst().orElse(null));

            PatientCase pCase = new PatientCase(
                    caseId,
                    ambulance,
                    "Accident Patient (" + inc.getIncidentType() + ")",
                    35,
                    "UNKNOWN",
                    inc.getDescription() != null ? inc.getDescription() : "Bystander Reported Trauma",
                    "RED"
            );
            patientCaseRepository.save(pCase);
        }

        inc.setStatus("PATIENT_LOADED");
        EmergencyIncident saved = incidentRepository.save(inc);

        IncidentDtos.IncidentDto dto = mapToDto(saved);
        broadcastAlert(dto);
        log.info("Patient boarded for incident {}. Active digital twin case is {}", inc.getIncidentCode(), caseId);

        return dto;
    }

    private void broadcastAlert(IncidentDtos.IncidentDto dto) {
        IncidentDtos.IncidentDto light = new IncidentDtos.IncidentDto();
        light.setId(dto.getId());
        light.setIncidentCode(dto.getIncidentCode());
        light.setBystanderName(dto.getBystanderName());
        light.setBystanderPhone(dto.getBystanderPhone());
        light.setIncidentType(dto.getIncidentType());
        light.setSeverity(dto.getSeverity());
        light.setCasualtyCount(dto.getCasualtyCount());
        light.setDescription(dto.getDescription());
        light.setLatitude(dto.getLatitude());
        light.setLongitude(dto.getLongitude());
        light.setLocationAddress(dto.getLocationAddress());
        light.setAssignedAmbulanceId(dto.getAssignedAmbulanceId());
        light.setAmbulanceCallSign(dto.getAmbulanceCallSign());
        light.setDistanceKm(dto.getDistanceKm());
        light.setEtaMinutes(dto.getEtaMinutes());
        light.setStatus(dto.getStatus());
        light.setReportedAt(dto.getReportedAt());
        light.setPatientCaseId(dto.getPatientCaseId());
        // Keep WebSocket STOMP frame lightweight (<1KB) by not attaching large raw base64 data
        if (dto.getPhotoUrl() != null && dto.getPhotoUrl().length() < 1000) {
            light.setPhotoUrl(dto.getPhotoUrl());
        } else if (dto.getPhotoUrl() != null) {
            light.setPhotoUrl("ATTACHED_PHOTO");
        }
        webSocketMessageService.broadcastIncidentAlert(light);
    }

    public IncidentDtos.IncidentDto mapToDto(EmergencyIncident inc) {
        IncidentDtos.IncidentDto dto = new IncidentDtos.IncidentDto();
        dto.setId(inc.getId());
        dto.setIncidentCode(inc.getIncidentCode());
        dto.setBystanderName(inc.getBystanderName());
        dto.setBystanderPhone(inc.getBystanderPhone());
        dto.setIncidentType(inc.getIncidentType());
        dto.setSeverity(inc.getSeverity());
        dto.setCasualtyCount(inc.getCasualtyCount());
        dto.setDescription(inc.getDescription());
        dto.setLatitude(inc.getLatitude());
        dto.setLongitude(inc.getLongitude());
        dto.setLocationAddress(inc.getLocationAddress());
        dto.setPhotoUrl(inc.getPhotoUrl());
        dto.setAssignedAmbulanceId(inc.getAssignedAmbulanceId());
        dto.setStatus(inc.getStatus());
        dto.setReportedAt(inc.getReportedAt());
        dto.setPatientCaseId(inc.getPatientCaseId());

        if (inc.getAssignedAmbulanceId() != null) {
            ambulanceRepository.findById(inc.getAssignedAmbulanceId()).ifPresent(a -> {
                dto.setAmbulanceCallSign(a.getCallSign());
            });

            ambulanceStateRepository.findFirstByAmbulanceIdOrderByTimestampDesc(inc.getAssignedAmbulanceId()).ifPresent(s -> {
                if (s.getLatitude() != null && s.getLongitude() != null && inc.getLatitude() != null && inc.getLongitude() != null) {
                    double dist = haversineRouter.calculateDistanceKm(s.getLatitude(), s.getLongitude(), inc.getLatitude(), inc.getLongitude());
                    if (dist > 30.0) {
                        dist = 2.4;
                    }
                    int etaSecs = haversineRouter.calculateEtaSeconds(dist, s.getSpeedKmh() != null ? s.getSpeedKmh() : 45.0, 1.15);
                    dto.setDistanceKm(dist);
                    dto.setEtaMinutes(Math.max(1, etaSecs / 60));
                }
            });
        }

        if (dto.getDistanceKm() == null) {
            dto.setDistanceKm(2.4);
            dto.setEtaMinutes(4);
            dto.setAmbulanceCallSign("AMB-01");
        }

        return dto;
    }
}
