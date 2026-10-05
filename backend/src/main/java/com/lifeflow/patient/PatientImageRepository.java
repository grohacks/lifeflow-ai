package com.lifeflow.patient;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientImageRepository extends JpaRepository<PatientImage, Long> {
    List<PatientImage> findByCaseIdOrderByTimestampDesc(String caseId);
    Optional<PatientImage> findByImageId(String imageId);
}
