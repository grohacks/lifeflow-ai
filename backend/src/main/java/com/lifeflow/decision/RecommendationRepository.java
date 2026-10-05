package com.lifeflow.decision;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {
    Optional<Recommendation> findByRecommendationId(String recommendationId);
    Optional<Recommendation> findFirstByCaseIdAndIsActiveTrueOrderByVersionNumberDesc(String caseId);
    List<Recommendation> findByCaseIdOrderByVersionNumberDesc(String caseId);
}
