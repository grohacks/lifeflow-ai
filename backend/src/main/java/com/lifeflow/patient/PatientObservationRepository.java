package com.lifeflow.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientObservationRepository extends JpaRepository<PatientObservation, Long> {
    List<PatientObservation> findByCaseIdOrderByTimestampDesc(String caseId);
}
