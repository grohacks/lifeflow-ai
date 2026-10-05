package com.lifeflow.decision;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeflow.hospital.Hospital;
import com.lifeflow.hospital.HospitalRepository;
import com.lifeflow.hospital.HospitalResource;
import com.lifeflow.hospital.HospitalResourceRepository;
import com.lifeflow.patient.PatientCase;
import com.lifeflow.patient.PatientCaseRepository;
import com.lifeflow.patient.PatientTwinState;
import com.lifeflow.patient.PatientTwinStateRepository;
import com.lifeflow.routing.HaversineRouter;
import com.lifeflow.transport.AmbulanceState;
import com.lifeflow.transport.AmbulanceStateRepository;
import com.lifeflow.transport.Route;
import com.lifeflow.transport.RouteRepository;
import com.lifeflow.websocket.WebSocketMessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class DestinationDecisionEngine {

    private static final Logger log = LoggerFactory.getLogger(DestinationDecisionEngine.class);

    private final RecommendationRepository recommendationRepository;
    private final CandidateDestinationRepository candidateRepository;
    private final DestinationEvaluationRepository evaluationRepository;
    private final HospitalRepository hospitalRepository;
    private final HospitalResourceRepository resourceRepository;
    private final PatientCaseRepository caseRepository;
    private final PatientTwinStateRepository twinStateRepository;
    private final AmbulanceStateRepository ambulanceStateRepository;
    private final RouteRepository routeRepository;
    private final HaversineRouter haversineRouter;
    private final WebSocketMessageService webSocketService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${lifeflow.decision.weights.clinical-fit:0.30}")
    private double weightClinicalFit;

    @Value("${lifeflow.decision.weights.future-resource:0.25}")
    private double weightFutureResource;

    @Value("${lifeflow.decision.weights.transport-utility:0.25}")
    private double weightTransportUtility;

    @Value("${lifeflow.decision.weights.patient-compatibility:0.10}")
    private double weightPatientCompat;

    @Value("${lifeflow.decision.weights.operational-capacity:0.10}")
    private double weightOpCapacity;

    @Value("${lifeflow.decision.weights.uncertainty-penalty:0.15}")
    private double weightUncertaintyPenalty;

    public DestinationDecisionEngine(RecommendationRepository recommendationRepository,
                                     CandidateDestinationRepository candidateRepository,
                                     DestinationEvaluationRepository evaluationRepository,
                                     HospitalRepository hospitalRepository,
                                     HospitalResourceRepository resourceRepository,
                                     PatientCaseRepository caseRepository,
                                     PatientTwinStateRepository twinStateRepository,
                                     AmbulanceStateRepository ambulanceStateRepository,
                                     RouteRepository routeRepository,
                                     HaversineRouter haversineRouter,
                                     @Lazy WebSocketMessageService webSocketService) {
        this.recommendationRepository = recommendationRepository;
        this.candidateRepository = candidateRepository;
        this.evaluationRepository = evaluationRepository;
        this.hospitalRepository = hospitalRepository;
        this.resourceRepository = resourceRepository;
        this.caseRepository = caseRepository;
        this.twinStateRepository = twinStateRepository;
        this.ambulanceStateRepository = ambulanceStateRepository;
        this.routeRepository = routeRepository;
        this.haversineRouter = haversineRouter;
        this.webSocketService = webSocketService;
    }

    @Transactional
    public Recommendation evaluateDestinations(String caseId, String correlationId) {
        log.info("[{}] Executing Future-State Destination Decision Engine for case: {}", correlationId, caseId);

        PatientCase patientCase = caseRepository.findByCaseId(caseId)
                .orElseThrow(() -> new IllegalArgumentException("Case not found: " + caseId));

        PatientTwinState twinState = twinStateRepository.findFirstByCaseIdOrderByTimestampDesc(caseId)
                .orElse(null);

        Long ambId = patientCase.getAmbulance() != null ? patientCase.getAmbulance().getId() : 1L;
        AmbulanceState ambState = ambulanceStateRepository.findFirstByAmbulanceIdOrderByTimestampDesc(ambId)
                .orElse(null);

        List<Hospital> hospitals = hospitalRepository.findByActiveTrue();
        if (hospitals.isEmpty()) {
            throw new IllegalStateException("No active hospitals available in regional network.");
        }

        // Determine next version number
        Optional<Recommendation> existingActive = recommendationRepository.findFirstByCaseIdAndIsActiveTrueOrderByVersionNumberDesc(caseId);
        int nextVersion = existingActive.map(r -> r.getVersionNumber() + 1).orElse(1);

        // Deactivate previous active recommendation
        existingActive.ifPresent(r -> {
            r.setIsActive(false);
            r.setStatus("SUPERSEDED");
            recommendationRepository.save(r);
        });

        // Create new Recommendation
        Recommendation recommendation = new Recommendation();
        recommendation.setRecommendationId(UUID.randomUUID().toString());
        recommendation.setCaseId(caseId);
        recommendation.setVersionNumber(nextVersion);
        recommendation.setIsActive(true);
        recommendation.setCreatedAt(Instant.now());
        recommendation.setValidUntil(Instant.now().plusSeconds(900)); // 15 min validity
        recommendation.setModelVersion("1.0.0");
        recommendation.setStatus("GENERATED");
        recommendation.setCorrelationId(correlationId != null ? correlationId : UUID.randomUUID().toString());

        Recommendation savedRecom = recommendationRepository.save(recommendation);

        List<CandidateDestination> candidateList = new ArrayList<>();

        // Patient conditions
        boolean isHighRisk = twinState != null && twinState.getSpo2() != null && twinState.getSpo2() < 91.0;
        boolean isCriticalHr = twinState != null && twinState.getHeartRate() != null && twinState.getHeartRate() > 120.0;
        boolean requiresCathLab = isCriticalHr || (patientCase.getChiefComplaint() != null && patientCase.getChiefComplaint().toLowerCase().contains("chest pain"));
        boolean requiresTrauma = isHighRisk || (patientCase.getChiefComplaint() != null && patientCase.getChiefComplaint().toLowerCase().contains("trauma"));

        for (Hospital h : hospitals) {
            CandidateDestination cand = new CandidateDestination();
            cand.setRecommendation(savedRecom);
            cand.setHospital(h);

            // 1. Calculate ETA
            double ambLat = ambState != null ? ambState.getLatitude() : 37.7749;
            double ambLon = ambState != null ? ambState.getLongitude() : -122.4194;
            double distanceKm = haversineRouter.calculateDistanceKm(ambLat, ambLon, h.getLatitude(), h.getLongitude());

            Optional<Route> optRoute = routeRepository.findByAmbulanceIdAndHospitalIdAndIsActiveTrue(ambId, h.getId());
            double trafficMultiplier = optRoute.map(Route::getTrafficMultiplier).orElse(1.0);
            int etaSeconds = haversineRouter.calculateEtaSeconds(distanceKm, 45.0, trafficMultiplier);

            cand.setDistanceKm(distanceKm);
            cand.setEtaSeconds(etaSeconds);

            // Fetch hospital resources
            List<HospitalResource> resources = resourceRepository.findByHospitalId(h.getId());
            int icuAvail = getAvail(resources, "ICU_BEDS");
            int edAvail = getAvail(resources, "ED_BEDS");
            int otAvail = getAvail(resources, "OT_THEATRES");
            boolean specAvail = getAvail(resources, "CARDIOLOGIST") > 0 || getAvail(resources, "TRAUMA_SURGEON") > 0;
            boolean anyStale = resources.stream().anyMatch(HospitalResource::isStale);

            // 2. Hard Feasibility Checks
            List<String> hardConstraints = new ArrayList<>();
            List<String> posFactors = new ArrayList<>();
            List<String> negFactors = new ArrayList<>();
            List<String> uncFactors = new ArrayList<>();

            boolean feasible = true;

            // Check hard constraints
            if (requiresTrauma && !"LEVEL_1".equals(h.getTraumaLevel()) && !"LEVEL_2".equals(h.getTraumaLevel())) {
                feasible = false;
                hardConstraints.add("Patient requires Level 1/2 Trauma accreditation; " + h.getName() + " is " + h.getTraumaLevel());
                negFactors.add("Lacks required trauma accreditation for acute deterioration");
            }

            if (requiresCathLab && !Boolean.TRUE.equals(h.getHasCathLab())) {
                feasible = false;
                hardConstraints.add("Cardiac catheterization suite required but absent");
                negFactors.add("Cath Lab unavailable");
            }

            if (icuAvail <= 0) {
                // If patient deteriorating, ICU is mandatory
                if (isHighRisk) {
                    feasible = false;
                    hardConstraints.add("Critical ICU bed required at ETA; zero ICU capacity available (0 beds)");
                    negFactors.add("Zero ICU bed capacity currently available");
                } else {
                    negFactors.add("ICU operating at maximum capacity (0 beds)");
                }
            } else {
                posFactors.add("ICU beds available (" + icuAvail + " vacant)");
            }

            if (otAvail > 0) {
                posFactors.add("Operating theatre ready (" + otAvail + " staffed suites)");
            }

            if (specAvail) {
                posFactors.add("On-call specialist team active on site");
            }

            if (distanceKm <= 5.0) {
                posFactors.add("Proximity advantage: transit distance under 5 km (" + distanceKm + " km)");
            }

            if (anyStale) {
                uncFactors.add("Hospital resource snapshot is stale (> 5 minutes without EHR sync)");
            }

            // 3. Multi-Criteria Scoring (0.0 to 100.0)
            double clinicalFit = calculateClinicalFit(h, requiresTrauma, requiresCathLab, isHighRisk);
            double futureResource = Math.min(100.0, (icuAvail * 25.0) + (edAvail * 5.0) + (otAvail * 15.0));
            // Transport Utility: 100 at 0 min, 0 at 30 min (1800 sec)
            double transportUtility = Math.max(0.0, 100.0 - (etaSeconds / 18.0));
            double patientCompat = 85.0; // Standard adult demographic fit
            double opCapacity = Math.min(100.0, Math.max(10.0, edAvail * 8.0));
            double uncertaintyPenalty = anyStale ? 25.0 : 5.0;

            cand.setClinicalFitScore(Math.round(clinicalFit * 10.0) / 10.0);
            cand.setFutureResourceScore(Math.round(futureResource * 10.0) / 10.0);
            cand.setTransportUtilityScore(Math.round(transportUtility * 10.0) / 10.0);
            cand.setPatientCompatibilityScore(Math.round(patientCompat * 10.0) / 10.0);
            cand.setOperationalCapacityScore(Math.round(opCapacity * 10.0) / 10.0);
            cand.setUncertaintyPenalty(Math.round(uncertaintyPenalty * 10.0) / 10.0);

            // Composite Suitability Score
            double composite = (weightClinicalFit * clinicalFit) +
                    (weightFutureResource * futureResource) +
                    (weightTransportUtility * transportUtility) +
                    (weightPatientCompat * patientCompat) +
                    (weightOpCapacity * opCapacity) -
                    (weightUncertaintyPenalty * uncertaintyPenalty);

            if (!feasible) {
                composite = Math.max(0.0, composite - 40.0); // Major penalty for infeasible
                cand.setFeasibility("INFEASIBLE");
            } else {
                cand.setFeasibility("FEASIBLE");
            }

            cand.setOverallSuitabilityScore(Math.round(composite * 10.0) / 10.0);

            // Build Destination Evaluation details
            DestinationEvaluation eval = new DestinationEvaluation();
            eval.setCandidateDestination(cand);
            try {
                eval.setPositiveFactorsJson(objectMapper.writeValueAsString(posFactors));
                eval.setNegativeFactorsJson(objectMapper.writeValueAsString(negFactors));
                eval.setHardConstraintsJson(objectMapper.writeValueAsString(hardConstraints));
                eval.setUncertaintyFactorsJson(objectMapper.writeValueAsString(uncFactors));
            } catch (Exception e) {
                log.error("Error serializing factor lists: {}", e.getMessage());
            }

            int etaMin = (int) Math.round(etaSeconds / 60.0);
            eval.setPatientForecastSummary("Patient projected at ETA +" + etaMin + "m: SpO2 ~" +
                    (twinState != null && twinState.getSpo2() != null ? Math.round(twinState.getSpo2() - 1.5) : 94) + "%, HR ~" +
                    (twinState != null && twinState.getHeartRate() != null ? Math.round(twinState.getHeartRate() + 4.0) : 115) + " bpm");
            eval.setHospitalForecastSummary("Hospital projected at ETA: ICU " + icuAvail + " beds, ED load " + (100 - edAvail * 5) + "%");
            eval.setTransportSummary("ETA: " + etaMin + " min (" + distanceKm + " km) at traffic index " + trafficMultiplier + "x");

            cand.setEvaluation(eval);
            candidateList.add(cand);
        }

        // Rank candidates: Feasible first sorted by score descending, then Infeasible
        candidateList.sort((a, b) -> {
            boolean aFeas = "FEASIBLE".equals(a.getFeasibility());
            boolean bFeas = "FEASIBLE".equals(b.getFeasibility());
            if (aFeas != bFeas) return aFeas ? -1 : 1;
            return Double.compare(b.getOverallSuitabilityScore(), a.getOverallSuitabilityScore());
        });

        int rank = 1;
        for (CandidateDestination c : candidateList) {
            c.setRankOrder(rank);
            c.setIsRecommended(rank == 1);
            rank++;
            candidateRepository.save(c);
            if (c.getEvaluation() != null) {
                evaluationRepository.save(c.getEvaluation());
            }
        }

        CandidateDestination top = candidateList.get(0);
        savedRecom.setSelectedHospital(top.getHospital());
        savedRecom.setUncertaintyScore(top.getUncertaintyPenalty());
        savedRecom.setSummaryReason(top.getHospital().getName() + " ranked #1 with suitability " +
                top.getOverallSuitabilityScore() + "/100. Clinical fit " + top.getClinicalFitScore() +
                ", ETA " + Math.round(top.getEtaSeconds() / 60.0) + " min.");
        savedRecom.setCandidates(candidateList);

        Recommendation finalRecom = recommendationRepository.save(savedRecom);

        // Broadcast new recommendation over WebSocket
        DecisionDtos.RecommendationDto dto = mapToDto(finalRecom);
        webSocketService.broadcastRecommendation(caseId, dto);

        return finalRecom;
    }

    private double calculateClinicalFit(Hospital h, boolean requiresTrauma, boolean requiresCathLab, boolean isHighRisk) {
        double score = 50.0;
        if ("LEVEL_1".equals(h.getTraumaLevel())) score += 35.0;
        else if ("LEVEL_2".equals(h.getTraumaLevel())) score += 25.0;
        else if ("LEVEL_3".equals(h.getTraumaLevel())) score += 10.0;

        if (Boolean.TRUE.equals(h.getHasCathLab())) score += 15.0;
        if (Boolean.TRUE.equals(h.getHasStrokeCenter())) score += 10.0;

        return Math.min(100.0, score);
    }

    private int getAvail(List<HospitalResource> resources, String type) {
        return resources.stream()
                .filter(r -> type.equals(r.getResourceType()))
                .mapToInt(HospitalResource::getAvailableCount)
                .sum();
    }

    @Transactional(readOnly = true)
    public DecisionDtos.RecommendationDto getActiveRecommendation(String caseId) {
        return recommendationRepository.findFirstByCaseIdAndIsActiveTrueOrderByVersionNumberDesc(caseId)
                .map(this::mapToDto)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<DecisionDtos.RecommendationDto> getRecommendationHistory(String caseId) {
        return recommendationRepository.findByCaseIdOrderByVersionNumberDesc(caseId).stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional
    public DecisionDtos.RecommendationDto evaluateDestinationsAndGetDto(String caseId, String correlationId) {
        Recommendation finalRecom = evaluateDestinations(caseId, correlationId);
        return mapToDto(finalRecom);
    }

    @Transactional(readOnly = true)
    public DecisionDtos.RecommendationDto mapToDto(Recommendation r) {
        DecisionDtos.RecommendationDto dto = new DecisionDtos.RecommendationDto();
        dto.setId(r.getId());
        dto.setRecommendationId(r.getRecommendationId());
        dto.setCaseId(r.getCaseId());
        dto.setVersionNumber(r.getVersionNumber());
        dto.setIsActive(r.getIsActive());
        dto.setCreatedAt(r.getCreatedAt());
        dto.setValidUntil(r.getValidUntil());
        if (r.getSelectedHospital() != null) {
            dto.setSelectedHospitalId(r.getSelectedHospital().getId());
            dto.setSelectedHospitalName(r.getSelectedHospital().getName());
        }
        dto.setModelVersion(r.getModelVersion());
        dto.setUncertaintyScore(r.getUncertaintyScore());
        dto.setStatus(r.getStatus());
        dto.setSummaryReason(r.getSummaryReason());

        List<CandidateDestination> cands = candidateRepository.findByRecommendationIdOrderByRankOrderAsc(r.getId());
        dto.setCandidates(cands.stream().map(this::mapCandidateToDto).toList());

        return dto;
    }

    private DecisionDtos.CandidateDestinationDto mapCandidateToDto(CandidateDestination c) {
        DecisionDtos.CandidateDestinationDto dto = new DecisionDtos.CandidateDestinationDto();
        dto.setId(c.getId());
        dto.setHospitalId(c.getHospital().getId());
        dto.setHospitalName(c.getHospital().getName());
        dto.setHospitalCode(c.getHospital().getHospitalCode());
        dto.setEtaSeconds(c.getEtaSeconds());
        dto.setDistanceKm(c.getDistanceKm());
        dto.setFeasibility(c.getFeasibility());
        dto.setClinicalFitScore(c.getClinicalFitScore());
        dto.setFutureResourceScore(c.getFutureResourceScore());
        dto.setTransportUtilityScore(c.getTransportUtilityScore());
        dto.setPatientCompatibilityScore(c.getPatientCompatibilityScore());
        dto.setOperationalCapacityScore(c.getOperationalCapacityScore());
        dto.setUncertaintyPenalty(c.getUncertaintyPenalty());
        dto.setOverallSuitabilityScore(c.getOverallSuitabilityScore());
        dto.setRankOrder(c.getRankOrder());
        dto.setIsRecommended(c.getIsRecommended());

        evaluationRepository.findByCandidateDestinationId(c.getId()).ifPresent(eval -> {
            DecisionDtos.DestinationEvaluationDto edto = new DecisionDtos.DestinationEvaluationDto();
            edto.setPatientForecastSummary(eval.getPatientForecastSummary());
            edto.setHospitalForecastSummary(eval.getHospitalForecastSummary());
            edto.setTransportSummary(eval.getTransportSummary());
            try {
                if (eval.getPositiveFactorsJson() != null)
                    edto.setPositiveFactors(objectMapper.readValue(eval.getPositiveFactorsJson(), List.class));
                if (eval.getNegativeFactorsJson() != null)
                    edto.setNegativeFactors(objectMapper.readValue(eval.getNegativeFactorsJson(), List.class));
                if (eval.getHardConstraintsJson() != null)
                    edto.setHardConstraints(objectMapper.readValue(eval.getHardConstraintsJson(), List.class));
                if (eval.getUncertaintyFactorsJson() != null)
                    edto.setUncertaintyFactors(objectMapper.readValue(eval.getUncertaintyFactorsJson(), List.class));
            } catch (Exception e) {
                log.warn("Error mapping evaluation JSON: {}", e.getMessage());
            }
            dto.setEvaluation(edto);
        });

        return dto;
    }
}
