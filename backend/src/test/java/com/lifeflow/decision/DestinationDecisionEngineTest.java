package com.lifeflow.decision;

import com.lifeflow.ambulance.Ambulance;
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
import com.lifeflow.transport.RouteRepository;
import com.lifeflow.websocket.WebSocketMessageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

public class DestinationDecisionEngineTest {

    private RecommendationRepository recommendationRepository;
    private CandidateDestinationRepository candidateRepository;
    private DestinationEvaluationRepository evaluationRepository;
    private HospitalRepository hospitalRepository;
    private HospitalResourceRepository resourceRepository;
    private PatientCaseRepository caseRepository;
    private PatientTwinStateRepository twinStateRepository;
    private AmbulanceStateRepository ambulanceStateRepository;
    private RouteRepository routeRepository;
    private HaversineRouter haversineRouter;
    private WebSocketMessageService webSocketService;
    private DestinationDecisionEngine decisionEngine;

    @BeforeEach
    public void setUp() {
        recommendationRepository = Mockito.mock(RecommendationRepository.class);
        candidateRepository = Mockito.mock(CandidateDestinationRepository.class);
        evaluationRepository = Mockito.mock(DestinationEvaluationRepository.class);
        hospitalRepository = Mockito.mock(HospitalRepository.class);
        resourceRepository = Mockito.mock(HospitalResourceRepository.class);
        caseRepository = Mockito.mock(PatientCaseRepository.class);
        twinStateRepository = Mockito.mock(PatientTwinStateRepository.class);
        ambulanceStateRepository = Mockito.mock(AmbulanceStateRepository.class);
        routeRepository = Mockito.mock(RouteRepository.class);
        haversineRouter = new HaversineRouter();
        webSocketService = Mockito.mock(WebSocketMessageService.class);

        decisionEngine = new DestinationDecisionEngine(
                recommendationRepository,
                candidateRepository,
                evaluationRepository,
                hospitalRepository,
                resourceRepository,
                caseRepository,
                twinStateRepository,
                ambulanceStateRepository,
                routeRepository,
                haversineRouter,
                webSocketService
        );

        // Inject default weights via reflection
        ReflectionTestUtils.setField(decisionEngine, "weightClinicalFit", 0.30);
        ReflectionTestUtils.setField(decisionEngine, "weightFutureResource", 0.25);
        ReflectionTestUtils.setField(decisionEngine, "weightTransportUtility", 0.25);
        ReflectionTestUtils.setField(decisionEngine, "weightPatientCompat", 0.10);
        ReflectionTestUtils.setField(decisionEngine, "weightOpCapacity", 0.10);
        ReflectionTestUtils.setField(decisionEngine, "weightUncertaintyPenalty", 0.15);
    }

    @Test
    public void testDestinationEvaluationCalculatesScores() {
        String caseId = "CASE-2026-001";

        Ambulance amb = new Ambulance();
        amb.setId(1L);
        amb.setCallSign("MED-01");

        PatientCase pc = new PatientCase();
        pc.setId(1L);
        pc.setCaseId(caseId);
        pc.setAmbulance(amb);
        pc.setChiefComplaint("Multi-system Trauma");

        PatientTwinState twin = new PatientTwinState();
        twin.setCaseId(caseId);
        twin.setHeartRate(118.0);
        twin.setSpo2(94.0);

        AmbulanceState ambState = new AmbulanceState();
        ambState.setAmbulance(amb);
        ambState.setLatitude(37.7749);
        ambState.setLongitude(-122.4194);

        Hospital h1 = new Hospital();
        h1.setId(1L);
        h1.setHospitalCode("HOSP-01");
        h1.setName("St. Jude Trauma Center");
        h1.setTraumaLevel("LEVEL_1");
        h1.setHasCathLab(true);
        h1.setHasStrokeCenter(true);
        h1.setLatitude(37.7833);
        h1.setLongitude(-122.4167);
        h1.setActive(true);

        HospitalResource resIcu = new HospitalResource();
        resIcu.setHospital(h1);
        resIcu.setResourceType("ICU_BEDS");
        resIcu.setAvailableCount(4);
        resIcu.setTotalCapacity(10);
        resIcu.setLastUpdatedAt(Instant.now());

        HospitalResource resEd = new HospitalResource();
        resEd.setHospital(h1);
        resEd.setResourceType("ED_BEDS");
        resEd.setAvailableCount(8);
        resEd.setTotalCapacity(20);
        resEd.setLastUpdatedAt(Instant.now());

        when(caseRepository.findByCaseId(caseId)).thenReturn(Optional.of(pc));
        when(twinStateRepository.findFirstByCaseIdOrderByTimestampDesc(caseId)).thenReturn(Optional.of(twin));
        when(ambulanceStateRepository.findFirstByAmbulanceIdOrderByTimestampDesc(1L)).thenReturn(Optional.of(ambState));
        when(hospitalRepository.findByActiveTrue()).thenReturn(List.of(h1));
        when(resourceRepository.findByHospitalId(1L)).thenReturn(List.of(resIcu, resEd));
        when(recommendationRepository.findFirstByCaseIdAndIsActiveTrueOrderByVersionNumberDesc(caseId)).thenReturn(Optional.empty());

        when(recommendationRepository.save(any(Recommendation.class))).thenAnswer(i -> {
            Recommendation r = i.getArgument(0);
            r.setId(101L);
            return r;
        });
        when(candidateRepository.save(any(CandidateDestination.class))).thenAnswer(i -> {
            CandidateDestination c = i.getArgument(0);
            c.setId(201L);
            return c;
        });

        Recommendation result = decisionEngine.evaluateDestinations(caseId, "CORR-TEST-01");

        assertNotNull(result);
        assertEquals(1, result.getVersionNumber());
        assertEquals("GENERATED", result.getStatus());
        assertEquals("St. Jude Trauma Center", result.getSelectedHospital().getName());
        assertNotNull(result.getCandidates());
        assertEquals(1, result.getCandidates().size());

        CandidateDestination topCandidate = result.getCandidates().get(0);
        assertEquals("FEASIBLE", topCandidate.getFeasibility());
        assertTrue(topCandidate.getOverallSuitabilityScore() > 50.0);
        assertEquals(1, topCandidate.getRankOrder());
        assertTrue(topCandidate.getIsRecommended());
    }
}
