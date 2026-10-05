package com.lifeflow.decision;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateDestinationRepository extends JpaRepository<CandidateDestination, Long> {
    List<CandidateDestination> findByRecommendationIdOrderByRankOrderAsc(Long recommendationId);
}
