package com.lifeflow.hospital;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HospitalResourceRepository extends JpaRepository<HospitalResource, Long> {
    List<HospitalResource> findByHospitalId(Long hospitalId);
    Optional<HospitalResource> findByHospitalIdAndResourceType(Long hospitalId, String resourceType);
}
