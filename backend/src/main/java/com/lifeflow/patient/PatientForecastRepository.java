package com.lifeflow.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientForecastRepository extends JpaRepository<PatientForecast, Long> {
    List<PatientForecast> findByCaseIdOrderByHorizonMinutesAsc(String caseId);
    List<PatientForecast> findByCaseIdAndMetricOrderByHorizonMinutesAsc(String caseId, String metric);
    void deleteByCaseId(String caseId);
}
