package com.lifeflow.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientTwinStateRepository extends JpaRepository<PatientTwinState, Long> {
    Optional<PatientTwinState> findFirstByCaseIdOrderByTimestampDesc(String caseId);
    List<PatientTwinState> findByCaseIdOrderByTimestampAsc(String caseId);
    List<PatientTwinState> findTop50ByCaseIdOrderByTimestampDesc(String caseId);
}
