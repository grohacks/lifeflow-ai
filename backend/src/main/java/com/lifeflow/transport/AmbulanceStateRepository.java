package com.lifeflow.transport;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AmbulanceStateRepository extends JpaRepository<AmbulanceState, Long> {
    Optional<AmbulanceState> findFirstByAmbulanceIdOrderByTimestampDesc(Long ambulanceId);
    List<AmbulanceState> findByAmbulanceIdOrderByTimestampDesc(Long ambulanceId);
}
