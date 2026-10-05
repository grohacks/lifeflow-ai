package com.lifeflow.ambulance;

import com.lifeflow.common.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AmbulanceService {

    private final AmbulanceRepository ambulanceRepository;

    public AmbulanceService(AmbulanceRepository ambulanceRepository) {
        this.ambulanceRepository = ambulanceRepository;
    }

    @Transactional(readOnly = true)
    public List<AmbulanceDtos.AmbulanceDto> getAllAmbulances() {
        return ambulanceRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AmbulanceDtos.AmbulanceDto getAmbulanceById(Long id) {
        Ambulance ambulance = ambulanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ambulance not found with ID: " + id));
        return mapToDto(ambulance);
    }

    @Transactional
    public AmbulanceDtos.AmbulanceDto createAmbulance(AmbulanceDtos.CreateAmbulanceRequest request) {
        Ambulance ambulance = new Ambulance(
                request.getVehicleNumber(),
                request.getCallSign(),
                request.getModel(),
                request.getBaseStation()
        );
        Ambulance saved = ambulanceRepository.save(ambulance);
        return mapToDto(saved);
    }

    @Transactional
    public AmbulanceDtos.AmbulanceDto updateStatus(Long id, String status) {
        Ambulance ambulance = ambulanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ambulance not found with ID: " + id));
        ambulance.setStatus(status);
        Ambulance updated = ambulanceRepository.save(ambulance);
        return mapToDto(updated);
    }

    public AmbulanceDtos.AmbulanceDto mapToDto(Ambulance ambulance) {
        return new AmbulanceDtos.AmbulanceDto(
                ambulance.getId(),
                ambulance.getVehicleNumber(),
                ambulance.getCallSign(),
                ambulance.getModel(),
                ambulance.getStatus(),
                ambulance.getBaseStation()
        );
    }
}
