package com.lifeflow.alert;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {
    Optional<Alert> findByAlertId(String alertId);
    List<Alert> findByStatusOrderByTimestampDesc(String status);
    List<Alert> findAllByOrderByTimestampDesc();
    List<Alert> findByCaseIdOrderByTimestampDesc(String caseId);
}
