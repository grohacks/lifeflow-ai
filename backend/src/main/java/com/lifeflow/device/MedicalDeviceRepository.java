package com.lifeflow.device;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalDeviceRepository extends JpaRepository<MedicalDevice, Long> {
    Optional<MedicalDevice> findByDeviceUid(String deviceUid);
    List<MedicalDevice> findByAmbulanceId(Long ambulanceId);
    List<MedicalDevice> findByDeviceType(String deviceType);
}
