package com.lifeflow.prealert;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HumanDecisionRepository extends JpaRepository<HumanDecision, Long> {
    Optional<HumanDecision> findByDecisionId(String decisionId);
    List<HumanDecision> findByCaseIdOrderByTimestampDesc(String caseId);
}
