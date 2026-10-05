package com.lifeflow.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientInterventionRepository extends JpaRepository<PatientIntervention, Long> {
    List<PatientIntervention> findByCaseIdOrderByTimestampDesc(String caseId);
}
