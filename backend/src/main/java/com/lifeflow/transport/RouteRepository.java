package com.lifeflow.transport;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RouteRepository extends JpaRepository<Route, Long> {
    List<Route> findByAmbulanceIdAndIsActiveTrue(Long ambulanceId);
    Optional<Route> findByAmbulanceIdAndHospitalIdAndIsActiveTrue(Long ambulanceId, Long hospitalId);
}
