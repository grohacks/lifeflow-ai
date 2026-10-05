package com.lifeflow.prealert;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PreAlertRepository extends JpaRepository<PreAlert, Long> {
    Optional<PreAlert> findByPrealertId(String prealertId);
    List<PreAlert> findByHospitalIdAndStatusOrderBySentAtDesc(Long hospitalId, String status);
    List<PreAlert> findByHospitalIdOrderBySentAtDesc(Long hospitalId);
    List<PreAlert> findByCaseIdOrderBySentAtDesc(String caseId);
    Optional<PreAlert> findFirstByCaseIdOrderBySentAtDesc(String caseId);
    List<PreAlert> findAllByOrderBySentAtDesc();
}
