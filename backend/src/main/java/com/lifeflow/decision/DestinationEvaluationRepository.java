package com.lifeflow.decision;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DestinationEvaluationRepository extends JpaRepository<DestinationEvaluation, Long> {
    Optional<DestinationEvaluation> findByCandidateDestinationId(Long candidateDestinationId);
}
