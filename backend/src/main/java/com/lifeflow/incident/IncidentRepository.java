package com.lifeflow.incident;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentRepository extends JpaRepository<EmergencyIncident, Long> {
    Optional<EmergencyIncident> findByIncidentCode(String incidentCode);
    List<EmergencyIncident> findByStatusInOrderByIdDesc(List<String> statuses);
    List<EmergencyIncident> findByStatusInOrderByReportedAtDesc(List<String> statuses);
    List<EmergencyIncident> findByAssignedAmbulanceIdAndStatusIn(Long ambulanceId, List<String> statuses);
    List<EmergencyIncident> findByPatientCaseId(String patientCaseId);
    Optional<EmergencyIncident> findFirstByPatientCaseId(String patientCaseId);
}
