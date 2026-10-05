package com.lifeflow.device;

import com.lifeflow.common.ResourceNotFoundException;
import com.lifeflow.websocket.WebSocketMessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DeviceService {

    private static final Logger log = LoggerFactory.getLogger(DeviceService.class);

    private final MedicalDeviceRepository deviceRepository;
    private final DeviceChannelRepository channelRepository;
    private final SensorObservationRepository observationRepository;
    private final WebSocketMessageService webSocketService;

    public DeviceService(MedicalDeviceRepository deviceRepository,
                         DeviceChannelRepository channelRepository,
                         SensorObservationRepository observationRepository,
                         @Lazy WebSocketMessageService webSocketService) {
        this.deviceRepository = deviceRepository;
        this.channelRepository = channelRepository;
        this.observationRepository = observationRepository;
        this.webSocketService = webSocketService;
    }

    @Transactional
    public SensorObservation processObservation(DeviceDtos.ObservationEventDto dto) {
        // 1. Deduplication check
        if (observationRepository.existsByEventId(dto.getEventId())) {
            log.debug("Duplicate observation event {} received; skipping persistence.", dto.getEventId());
            return observationRepository.findByEventId(dto.getEventId()).orElse(null);
        }

        // 2. Normalization & Validation
        validateAndNormalize(dto);

        // 3. Map to Entity
        SensorObservation obs = new SensorObservation();
        obs.setEventId(dto.getEventId() != null ? dto.getEventId() : UUID.randomUUID().toString());
        obs.setCaseId(dto.getPatientCaseId());
        obs.setAmbulanceId(dto.getAmbulanceId());
        obs.setDeviceId(dto.getDeviceId());
        obs.setDeviceUid(dto.getDeviceUid());
        obs.setDeviceType(dto.getDeviceType());
        obs.setMetric(dto.getMetric());
        obs.setValue(dto.getValue());
        obs.setUnit(dto.getUnit());
        obs.setSourceTimestamp(dto.getSourceTimestamp() != null ? dto.getSourceTimestamp() : Instant.now());
        obs.setGatewayTimestamp(dto.getGatewayTimestamp() != null ? dto.getGatewayTimestamp() : Instant.now());
        obs.setQuality(dto.getQuality() != null ? dto.getQuality() : "GOOD");
        obs.setSignalQuality(dto.getSignalQuality() != null ? dto.getSignalQuality() : 1.0);
        obs.setProvenance(dto.getProvenance() != null ? dto.getProvenance() : "EDGE_GATEWAY");
        obs.setDeviceStatus(dto.getDeviceStatus() != null ? dto.getDeviceStatus() : "CONNECTED");
        obs.setBatteryStatus(dto.getBatteryStatus() != null ? dto.getBatteryStatus() : 100);
        obs.setCalibrationStatus(dto.getCalibrationStatus() != null ? dto.getCalibrationStatus() : "CALIBRATED");
        obs.setSequenceNumber(dto.getSequenceNumber() != null ? dto.getSequenceNumber() : 1L);
        obs.setCorrelationId(dto.getCorrelationId() != null ? dto.getCorrelationId() : UUID.randomUUID().toString());

        SensorObservation saved = observationRepository.save(obs);

        // 4. Broadcast via WebSocket
        webSocketService.broadcastTelemetry(dto.getAmbulanceId(), dto);

        return saved;
    }

    private void validateAndNormalize(DeviceDtos.ObservationEventDto dto) {
        // Temperature Fahrenheit to Celsius conversion if needed
        if ("TEMPERATURE".equalsIgnoreCase(dto.getMetric()) && "°F".equalsIgnoreCase(dto.getUnit())) {
            dto.setValue(Math.round(((dto.getValue() - 32.0) * 5.0 / 9.0) * 10.0) / 10.0);
            dto.setUnit("°C");
        }

        // Physiological range sanity bounds
        double val = dto.getValue();
        switch (dto.getMetric()) {
            case "HEART_RATE":
                if (val < 20.0 || val > 300.0) {
                    dto.setQuality("INVALID");
                    dto.setSignalQuality(0.0);
                }
                break;
            case "SPO2":
                if (val < 0.0 || val > 100.0) {
                    dto.setQuality("INVALID");
                    dto.setSignalQuality(0.0);
                }
                break;
            case "RESPIRATORY_RATE":
                if (val < 2.0 || val > 80.0) {
                    dto.setQuality("INVALID");
                    dto.setSignalQuality(0.0);
                }
                break;
            case "TEMPERATURE":
                if (val < 25.0 || val > 45.0) {
                    dto.setQuality("INVALID");
                    dto.setSignalQuality(0.0);
                }
                break;
            default:
                break;
        }
    }

    @Transactional
    public DeviceDtos.SyncBatchResponse syncBatch(DeviceDtos.SyncBatchRequest request) {
        String syncId = UUID.randomUUID().toString();
        int totalReceived = request.getObservations() != null ? request.getObservations().size() : 0;
        int deduplicated = 0;
        int persisted = 0;

        if (request.getObservations() != null) {
            for (DeviceDtos.ObservationEventDto obsDto : request.getObservations()) {
                if (obsDto.getEventId() != null && observationRepository.existsByEventId(obsDto.getEventId())) {
                    deduplicated++;
                } else {
                    processObservation(obsDto);
                    persisted++;
                }
            }
        }

        log.info("Batch sync completed: ID={}, Total={}, Persisted={}, Deduplicated={}",
                syncId, totalReceived, persisted, deduplicated);

        return new DeviceDtos.SyncBatchResponse(syncId, totalReceived, deduplicated, persisted, "COMPLETED");
    }

    @Transactional(readOnly = true)
    public List<SensorObservation> getObservationsByCase(String caseId, int page, int size) {
        Page<SensorObservation> obsPage = observationRepository.findByCaseIdOrderBySourceTimestampDesc(
                caseId, PageRequest.of(page, size)
        );
        return obsPage.getContent();
    }

    @Transactional(readOnly = true)
    public List<DeviceDtos.MedicalDeviceDto> getAllDevices() {
        return deviceRepository.findAll().stream()
                .map(this::mapDeviceToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DeviceDtos.MedicalDeviceDto> getDevicesByAmbulance(Long ambulanceId) {
        return deviceRepository.findByAmbulanceId(ambulanceId).stream()
                .map(this::mapDeviceToDto)
                .collect(Collectors.toList());
    }

    public DeviceDtos.MedicalDeviceDto mapDeviceToDto(MedicalDevice d) {
        return new DeviceDtos.MedicalDeviceDto(
                d.getId(),
                d.getAmbulance() != null ? d.getAmbulance().getId() : null,
                d.getDeviceUid(),
                d.getDeviceType(),
                d.getManufacturer(),
                d.getModelName(),
                d.getStatus(),
                d.getBatteryLevel(),
                d.getCalibrationStatus(),
                d.getLastPingAt()
        );
    }
}
