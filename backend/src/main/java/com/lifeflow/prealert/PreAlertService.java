package com.lifeflow.prealert;

import com.lifeflow.ambulance.Ambulance;
import com.lifeflow.ambulance.AmbulanceRepository;
import com.lifeflow.common.ResourceNotFoundException;
import com.lifeflow.decision.Recommendation;
import com.lifeflow.decision.RecommendationRepository;
import com.lifeflow.hospital.Hospital;
import com.lifeflow.hospital.HospitalRepository;
import com.lifeflow.patient.*;
import com.lifeflow.routing.HaversineRouter;
import com.lifeflow.transport.AmbulanceState;
import com.lifeflow.transport.AmbulanceStateRepository;
import com.lifeflow.websocket.WebSocketMessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PreAlertService {

    private static final Logger log = LoggerFactory.getLogger(PreAlertService.class);

    private final HumanDecisionRepository decisionRepository;
    private final PreAlertRepository preAlertRepository;
    private final RecommendationRepository recommendationRepository;
    private final HospitalRepository hospitalRepository;
    private final AmbulanceRepository ambulanceRepository;
    private final PatientCaseRepository caseRepository;
    private final PatientTwinStateRepository twinStateRepository;
    private final AmbulanceStateRepository ambulanceStateRepository;
    private final HaversineRouter haversineRouter;
    private final WebSocketMessageService webSocketService;
    private final com.lifeflow.incident.IncidentRepository incidentRepository;

    public PreAlertService(HumanDecisionRepository decisionRepository,
                           PreAlertRepository preAlertRepository,
                           RecommendationRepository recommendationRepository,
                           HospitalRepository hospitalRepository,
                           AmbulanceRepository ambulanceRepository,
                           PatientCaseRepository caseRepository,
                           PatientTwinStateRepository twinStateRepository,
                           AmbulanceStateRepository ambulanceStateRepository,
                           HaversineRouter haversineRouter,
                           WebSocketMessageService webSocketService,
                           @org.springframework.context.annotation.Lazy com.lifeflow.incident.IncidentRepository incidentRepository) {
        this.decisionRepository = decisionRepository;
        this.preAlertRepository = preAlertRepository;
        this.recommendationRepository = recommendationRepository;
        this.hospitalRepository = hospitalRepository;
        this.ambulanceRepository = ambulanceRepository;
        this.caseRepository = caseRepository;
        this.twinStateRepository = twinStateRepository;
        this.ambulanceStateRepository = ambulanceStateRepository;
        this.haversineRouter = haversineRouter;
        this.webSocketService = webSocketService;
        this.incidentRepository = incidentRepository;
    }

    @Transactional
    public PreAlertDtos.PreAlertDto recordHumanDecisionAndCreatePreAlert(
            PreAlertDtos.RecordDecisionRequest req, Long userId, String userName, String correlationId) {

        log.info("[{}] Recording human destination confirmation for case {}: hospital={}, type={}",
                correlationId, req.getCaseId(), req.getSelectedHospitalId(), req.getDecisionType());

        Hospital hospital = hospitalRepository.findById(req.getSelectedHospitalId())
                .orElseThrow(() -> new ResourceNotFoundException("Hospital not found: " + req.getSelectedHospitalId()));

        PatientCase patientCase = caseRepository.findByCaseId(req.getCaseId())
                .orElseThrow(() -> new ResourceNotFoundException("Case not found: " + req.getCaseId()));

        Recommendation recommendation = null;
        if (req.getRecommendationId() != null) {
            recommendation = recommendationRepository.findById(req.getRecommendationId()).orElse(null);
        }

        // 1. Record Human Decision
        HumanDecision decision = new HumanDecision();
        decision.setDecisionId(UUID.randomUUID().toString());
        decision.setCaseId(req.getCaseId());
        decision.setRecommendation(recommendation);
        decision.setSelectedHospital(hospital);
        decision.setDecisionType(req.getDecisionType());
        decision.setUserId(userId);
        decision.setUserName(userName != null ? userName : "Paramedic Lead");
        decision.setReason(req.getReason());
        decision.setModelVersion("1.0.0");
        decision.setCorrelationId(correlationId != null ? correlationId : UUID.randomUUID().toString());
        decision.setTimestamp(Instant.now());

        HumanDecision savedDecision = decisionRepository.save(decision);

        // Update recommendation status to ACCEPTED or OVERRIDDEN
        if (recommendation != null) {
            recommendation.setStatus("ACCEPT".equalsIgnoreCase(req.getDecisionType()) ? "ACCEPTED" : "OVERRIDDEN");
            recommendationRepository.save(recommendation);
        }

        // 2. Compute ETA and summaries for Pre-Alert
        Ambulance ambulance = patientCase.getAmbulance() != null ? patientCase.getAmbulance() :
                ambulanceRepository.findAll().stream().findFirst().orElse(null);

        Long ambId = ambulance != null ? ambulance.getId() : 1L;
        AmbulanceState ambState = ambulanceStateRepository.findFirstByAmbulanceIdOrderByTimestampDesc(ambId).orElse(null);
        double ambLat = ambState != null ? ambState.getLatitude() : 37.7749;
        double ambLon = ambState != null ? ambState.getLongitude() : -122.4194;
        double distanceKm = haversineRouter.calculateDistanceKm(ambLat, ambLon, hospital.getLatitude(), hospital.getLongitude());
        int etaSeconds = haversineRouter.calculateEtaSeconds(distanceKm, 45.0, 1.0);

        PatientTwinState twinState = twinStateRepository.findFirstByCaseIdOrderByTimestampDesc(req.getCaseId()).orElse(null);
        String patientSummary = String.format("Patient %s, %s yo %s. Chief Complaint: %s. Current Vitals: HR=%s bpm, SpO2=%s%%, BP=%s/%s mmHg, RR=%s.",
                patientCase.getPatientIdentifier() != null ? patientCase.getPatientIdentifier() : "Unknown",
                patientCase.getAge() != null ? patientCase.getAge() : 45,
                patientCase.getGender() != null ? patientCase.getGender() : "M",
                patientCase.getChiefComplaint() != null ? patientCase.getChiefComplaint() : "Acute Trauma",
                twinState != null && twinState.getHeartRate() != null ? Math.round(twinState.getHeartRate()) : 110,
                twinState != null && twinState.getSpo2() != null ? Math.round(twinState.getSpo2()) : 95,
                twinState != null && twinState.getSystolicBp() != null ? Math.round(twinState.getSystolicBp()) : 110,
                twinState != null && twinState.getDiastolicBp() != null ? Math.round(twinState.getDiastolicBp()) : 70,
                twinState != null && twinState.getRespiratoryRate() != null ? Math.round(twinState.getRespiratoryRate()) : 22);

        // Clear any old pre-alerts for this case so we always start clean with the new dispatch
        List<PreAlert> existingAlerts = preAlertRepository.findByCaseIdOrderBySentAtDesc(req.getCaseId());
        if (!existingAlerts.isEmpty()) {
            preAlertRepository.deleteAll(existingAlerts);
            preAlertRepository.flush();
        }

        // 3. Create PreAlert
        PreAlert preAlert = new PreAlert();
        preAlert.setPrealertId(UUID.randomUUID().toString());
        preAlert.setCaseId(req.getCaseId());
        preAlert.setAmbulance(ambulance);
        preAlert.setHospital(hospital);
        preAlert.setHumanDecision(savedDecision);
        preAlert.setEtaSeconds(etaSeconds);
        preAlert.setPatientSummary(patientSummary);
        preAlert.setRelevantObservations(twinState != null ? twinState.getInjuryObservations() : "Blunt chest trauma, tachypnea");
        preAlert.setInterventionsPerformed(twinState != null ? twinState.getInterventions() : "High-flow O2 15L/min NRB, IV access established");
        preAlert.setRequestedCapabilities("Immediate Trauma Bay 1 Activation, CT Chest/Abdomen on standby, On-call General Surgery");
        preAlert.setStatus("PENDING_ACK");
        preAlert.setSentAt(Instant.now());
        preAlert.setCorrelationId(correlationId != null ? correlationId : UUID.randomUUID().toString());

        PreAlert savedPreAlert = preAlertRepository.save(preAlert);

        // 4. Broadcast PreAlert to Hospital and Case Channels
        PreAlertDtos.PreAlertDto dto = mapPreAlertToDto(savedPreAlert);
        webSocketService.broadcastPreAlert(hospital.getId(), savedPreAlert.getCaseId(), dto);

        return dto;
    }

    private PreAlert findAlertByIdOrPrealertId(String identifier) {
        Optional<PreAlert> byString = preAlertRepository.findByPrealertId(identifier);
        if (byString.isPresent()) {
            return byString.get();
        }
        try {
            Long numId = Long.parseLong(identifier);
            return preAlertRepository.findById(numId)
                    .orElseThrow(() -> new ResourceNotFoundException("Pre-alert not found: " + identifier));
        } catch (NumberFormatException e) {
            throw new ResourceNotFoundException("Pre-alert not found: " + identifier);
        }
    }

    @Transactional
    public PreAlertDtos.PreAlertDto acknowledgePreAlert(String prealertId, String acknowledgedBy) {
        PreAlert preAlert = findAlertByIdOrPrealertId(prealertId);

        preAlert.setStatus("ACCEPTED");
        preAlert.setAcknowledgedAt(Instant.now());
        preAlert.setAcknowledgedBy(acknowledgedBy != null ? acknowledgedBy : "ED Triage Nurse");

        PreAlert updated = preAlertRepository.save(preAlert);

        PreAlertDtos.PreAlertDto dto = mapPreAlertToDto(updated);
        webSocketService.broadcastPreAlert(updated.getHospital().getId(), updated.getCaseId(), dto);

        return dto;
    }

    @Transactional
    public PreAlertDtos.PreAlertDto reserveResources(String prealertId, PreAlertDtos.ReserveResourcesRequest req) {
        PreAlert preAlert = findAlertByIdOrPrealertId(prealertId);

        if (req.getReservedBeds() != null) {
            preAlert.setReservedBeds(req.getReservedBeds());
        }
        if (req.getReservedBloodUnits() != null) {
            preAlert.setReservedBloodUnits(req.getReservedBloodUnits());
        }
        if (req.getReservedEquipment() != null) {
            preAlert.setReservedEquipment(req.getReservedEquipment());
        }
        preAlert.setStatus("ACCEPTED");
        if (preAlert.getAcknowledgedAt() == null) {
            preAlert.setAcknowledgedAt(Instant.now());
        }

        PreAlert updated = preAlertRepository.save(preAlert);
        PreAlertDtos.PreAlertDto dto = mapPreAlertToDto(updated);
        webSocketService.broadcastPreAlert(updated.getHospital().getId(), updated.getCaseId(), dto);
        return dto;
    }

    @Transactional
    public PreAlertDtos.PreAlertDto notifyDoctor(String prealertId, PreAlertDtos.NotifyDoctorRequest req) {
        PreAlert preAlert = findAlertByIdOrPrealertId(prealertId);

        preAlert.setAssignedDoctorName(req.getDoctorName());
        preAlert.setDoctorNotified(true);
        preAlert.setDoctorNotifiedAt(Instant.now());

        PreAlert updated = preAlertRepository.save(preAlert);
        PreAlertDtos.PreAlertDto dto = mapPreAlertToDto(updated);
        webSocketService.broadcastPreAlert(updated.getHospital().getId(), updated.getCaseId(), dto);
        return dto;
    }

    @Transactional
    public PreAlertDtos.PreAlertDto saveDoctorOrders(String prealertId, PreAlertDtos.DoctorOrdersRequest req) {
        PreAlert preAlert = findAlertByIdOrPrealertId(prealertId);

        preAlert.setDoctorOrders(req.getDoctorOrders());
        if (req.getDoctorName() != null && preAlert.getAssignedDoctorName() == null) {
            preAlert.setAssignedDoctorName(req.getDoctorName());
        }

        PreAlert updated = preAlertRepository.save(preAlert);
        PreAlertDtos.PreAlertDto dto = mapPreAlertToDto(updated);
        webSocketService.broadcastPreAlert(updated.getHospital().getId(), updated.getCaseId(), dto);
        return dto;
    }

    @Transactional
    public PreAlertDtos.PreAlertDto markAmbulanceArrived(String prealertId, String arrivedBy) {
        PreAlert preAlert = findAlertByIdOrPrealertId(prealertId);
        preAlert.setStatus("ARRIVED");
        preAlert.setEtaSeconds(0);

        PreAlert updated = preAlertRepository.save(preAlert);
        PreAlertDtos.PreAlertDto dto = mapPreAlertToDto(updated);
        webSocketService.broadcastPreAlert(updated.getHospital().getId(), updated.getCaseId(), dto);
        return dto;
    }

    @Transactional
    public void clearPreAlertsForHospital(Long hospitalId) {
        List<PreAlert> alerts = preAlertRepository.findByHospitalIdOrderBySentAtDesc(hospitalId);
        preAlertRepository.deleteAll(alerts);
        webSocketService.broadcastPreAlert(hospitalId, null, Map.of("action", "QUEUE_CLEARED", "hospitalId", hospitalId));
    }

    @Transactional(readOnly = true)
    public List<PreAlertDtos.PreAlertDto> getPreAlertsForHospital(Long hospitalId) {
        return preAlertRepository.findByHospitalIdOrderBySentAtDesc(hospitalId).stream()
                .map(this::mapPreAlertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PreAlertDtos.PreAlertDto> getAllPreAlerts() {
        return preAlertRepository.findAllByOrderBySentAtDesc().stream()
                .map(this::mapPreAlertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PreAlertDtos.PreAlertDto getLatestPreAlertForCase(String caseId) {
        return preAlertRepository.findFirstByCaseIdOrderBySentAtDesc(caseId)
                .map(this::mapPreAlertToDto)
                .orElse(null);
    }

    public PreAlertDtos.PreAlertDto mapPreAlertToDto(PreAlert p) {
        PreAlertDtos.PreAlertDto dto = new PreAlertDtos.PreAlertDto();
        dto.setId(p.getId());
        dto.setPrealertId(p.getPrealertId());
        dto.setCaseId(p.getCaseId());
        if (p.getAmbulance() != null) {
            dto.setAmbulanceId(p.getAmbulance().getId());
            dto.setVehicleNumber(p.getAmbulance().getVehicleNumber());
        }
        if (p.getHospital() != null) {
            dto.setHospitalId(p.getHospital().getId());
            dto.setHospitalName(p.getHospital().getName());
            dto.setHospitalLatitude(p.getHospital().getLatitude());
            dto.setHospitalLongitude(p.getHospital().getLongitude());
        }
        if (incidentRepository != null) {
            incidentRepository.findFirstByPatientCaseId(p.getCaseId()).ifPresent(inc -> {
                dto.setIncidentLatitude(inc.getLatitude());
                dto.setIncidentLongitude(inc.getLongitude());
            });
        }
        dto.setEtaSeconds(p.getEtaSeconds());
        dto.setPatientSummary(p.getPatientSummary());
        dto.setRelevantObservations(p.getRelevantObservations());
        dto.setInterventionsPerformed(p.getInterventionsPerformed());
        dto.setRequestedCapabilities(p.getRequestedCapabilities());
        dto.setStatus(p.getStatus());
        dto.setSentAt(p.getSentAt());
        dto.setAcknowledgedAt(p.getAcknowledgedAt());
        dto.setAcknowledgedBy(p.getAcknowledgedBy());
        dto.setReservedBeds(p.getReservedBeds());
        dto.setReservedBloodUnits(p.getReservedBloodUnits());
        dto.setReservedEquipment(p.getReservedEquipment());
        dto.setAssignedDoctorName(p.getAssignedDoctorName());
        dto.setDoctorNotified(p.getDoctorNotified());
        dto.setDoctorNotifiedAt(p.getDoctorNotifiedAt());
        dto.setDoctorOrders(p.getDoctorOrders());
        return dto;
    }

    @Transactional
    public void clearPreAlertsForCase(String caseId) {
        List<PreAlert> alerts = preAlertRepository.findByCaseIdOrderBySentAtDesc(caseId);
        preAlertRepository.deleteAll(alerts);
        webSocketService.broadcastPreAlert(null, caseId, Map.of("action", "QUEUE_CLEARED", "caseId", caseId));
    }
}
