package com.lifeflow.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientCaseRepository extends JpaRepository<PatientCase, Long> {
    Optional<PatientCase> findByCaseId(String caseId);
    List<PatientCase> findByStatus(String status);
    Optional<PatientCase> findFirstByAmbulanceIdAndStatus(Long ambulanceId, String status);
}
