package com.lifeflow.agent;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AgentRunRepository extends JpaRepository<AgentRun, Long> {
    Optional<AgentRun> findByRunId(String runId);
    List<AgentRun> findAllByOrderByTimestampDesc();
    List<AgentRun> findByCaseIdOrderByTimestampDesc(String caseId);
    List<AgentRun> findByAgentIdOrderByTimestampDesc(String agentId);
}
