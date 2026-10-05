package com.lifeflow.device;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface SensorObservationRepository extends JpaRepository<SensorObservation, Long> {
    Optional<SensorObservation> findByEventId(String eventId);

    List<SensorObservation> findByCaseIdOrderBySourceTimestampAsc(String caseId);

    Page<SensorObservation> findByCaseIdOrderBySourceTimestampDesc(String caseId, Pageable pageable);

    List<SensorObservation> findByCaseIdAndMetricOrderBySourceTimestampAsc(String caseId, String metric);

    List<SensorObservation> findByCaseIdAndSourceTimestampAfterOrderBySourceTimestampAsc(String caseId, Instant after);

    @Query("SELECT o FROM SensorObservation o WHERE o.caseId = :caseId AND o.metric = :metric ORDER BY o.sourceTimestamp DESC LIMIT 1")
    Optional<SensorObservation> findLatestByCaseIdAndMetric(@Param("caseId") String caseId, @Param("metric") String metric);

    boolean existsByEventId(String eventId);
}
