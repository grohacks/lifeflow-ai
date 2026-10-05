package com.lifeflow.ambulance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface AmbulanceRepository extends JpaRepository<Ambulance, Long> {
    Optional<Ambulance> findByVehicleNumber(String vehicleNumber);
    Optional<Ambulance> findByCallSign(String callSign);
    List<Ambulance> findByStatus(String status);
}
