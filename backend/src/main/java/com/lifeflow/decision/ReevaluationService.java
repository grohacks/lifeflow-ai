package com.lifeflow.decision;

import com.lifeflow.patient.PatientCase;
import com.lifeflow.patient.PatientCaseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ReevaluationService {

    private static final Logger log = LoggerFactory.getLogger(ReevaluationService.class);

    private final DestinationDecisionEngine decisionEngine;
    private final PatientCaseRepository patientCaseRepository;

    public ReevaluationService(@Lazy DestinationDecisionEngine decisionEngine,
                               PatientCaseRepository patientCaseRepository) {
        this.decisionEngine = decisionEngine;
        this.patientCaseRepository = patientCaseRepository;
    }

    @Async("decisionExecutor")
    public void triggerPatientReevaluation(String caseId) {
        log.info("Triggering continuous destination re-evaluation due to material patient vital change for case: {}", caseId);
        try {
            decisionEngine.evaluateDestinations(caseId, UUID.randomUUID().toString());
        } catch (Exception e) {
            log.error("Error during patient reevaluation: {}", e.getMessage(), e);
        }
    }

    @Async("decisionExecutor")
    public void triggerHospitalReevaluation(Long hospitalId, String resourceType) {
        log.info("Triggering continuous destination re-evaluation due to hospital {} resource change ({})", hospitalId, resourceType);
        List<PatientCase> activeCases = patientCaseRepository.findByStatus("ACTIVE");
        for (PatientCase pc : activeCases) {
            try {
                decisionEngine.evaluateDestinations(pc.getCaseId(), UUID.randomUUID().toString());
            } catch (Exception e) {
                log.error("Error during hospital reevaluation for case {}: {}", pc.getCaseId(), e.getMessage());
            }
        }
    }

    @Async("decisionExecutor")
    public void triggerTrafficReevaluation(Long ambulanceId, double trafficMultiplier) {
        log.info("Triggering continuous destination re-evaluation due to traffic change ({}x) for ambulance {}", trafficMultiplier, ambulanceId);
        patientCaseRepository.findFirstByAmbulanceIdAndStatus(ambulanceId, "ACTIVE").ifPresent(pc -> {
            try {
                decisionEngine.evaluateDestinations(pc.getCaseId(), UUID.randomUUID().toString());
            } catch (Exception e) {
                log.error("Error during traffic reevaluation for case {}: {}", pc.getCaseId(), e.getMessage());
            }
        });
    }

    @Async("decisionExecutor")
    public void triggerEtaReevaluation(Long ambulanceId, Long hospitalId, int newEtaSeconds) {
        log.info("Triggering continuous destination re-evaluation due to material ETA shift ({}s) to hospital {}", newEtaSeconds, hospitalId);
        patientCaseRepository.findFirstByAmbulanceIdAndStatus(ambulanceId, "ACTIVE").ifPresent(pc -> {
            try {
                decisionEngine.evaluateDestinations(pc.getCaseId(), UUID.randomUUID().toString());
            } catch (Exception e) {
                log.error("Error during ETA reevaluation for case {}: {}", pc.getCaseId(), e.getMessage());
            }
        });
    }
}
