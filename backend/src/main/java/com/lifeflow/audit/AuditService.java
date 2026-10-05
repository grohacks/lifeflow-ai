package com.lifeflow.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditEventRepository auditEventRepository;

    public AuditService(AuditEventRepository auditEventRepository) {
        this.auditEventRepository = auditEventRepository;
    }

    @Transactional
    public AuditEvent logEvent(String eventType, String actorUser, String caseId,
                              Long ambulanceId, Long hospitalId, String prevStateJson,
                              String newStateJson, Long recommendationId, Long decisionId,
                              String correlationId) {
        AuditEvent event = new AuditEvent();
        event.setEventId(UUID.randomUUID().toString());
        event.setEventType(eventType);
        event.setActorUser(actorUser != null ? actorUser : "SYSTEM");
        event.setCaseId(caseId);
        event.setAmbulanceId(ambulanceId);
        event.setHospitalId(hospitalId);
        event.setPreviousStateJson(prevStateJson);
        event.setNewStateJson(newStateJson);
        event.setRecommendationId(recommendationId);
        event.setDecisionId(decisionId);
        event.setCorrelationId(correlationId != null ? correlationId : UUID.randomUUID().toString());
        event.setTimestamp(Instant.now());

        AuditEvent saved = auditEventRepository.save(event);
        log.info("[{}] AUDIT: [{}] by [{}] for case [{}]", event.getCorrelationId(), eventType, event.getActorUser(), caseId);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<AuditEvent> getAuditByCase(String caseId) {
        return auditEventRepository.findByCaseIdOrderByTimestampDesc(caseId);
    }

    @Transactional(readOnly = true)
    public Page<AuditEvent> getAllAuditEvents(int page, int size) {
        return auditEventRepository.findAllByOrderByTimestampDesc(PageRequest.of(page, size));
    }
}
