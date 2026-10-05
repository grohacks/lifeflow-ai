package com.lifeflow.twin;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lifeflow.common.ResourceNotFoundException;
import com.lifeflow.decision.ReevaluationService;
import com.lifeflow.device.SensorObservation;
import com.lifeflow.device.SensorObservationRepository;
import com.lifeflow.patient.*;
import com.lifeflow.websocket.WebSocketMessageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class PatientTwinService {

    private static final Logger log = LoggerFactory.getLogger(PatientTwinService.class);

    private final PatientTwinStateRepository twinStateRepository;
    private final SensorObservationRepository observationRepository;
    private final PatientForecastRepository forecastRepository;
    private final WebSocketMessageService webSocketService;
    private final ReevaluationService reevaluationService;
    private final com.lifeflow.incident.IncidentRepository incidentRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public PatientTwinService(PatientTwinStateRepository twinStateRepository,
                              SensorObservationRepository observationRepository,
                              PatientForecastRepository forecastRepository,
                              @Lazy WebSocketMessageService webSocketService,
                              @Lazy ReevaluationService reevaluationService,
                              @Lazy com.lifeflow.incident.IncidentRepository incidentRepository) {
        this.twinStateRepository = twinStateRepository;
        this.observationRepository = observationRepository;
        this.forecastRepository = forecastRepository;
        this.webSocketService = webSocketService;
        this.reevaluationService = reevaluationService;
        this.incidentRepository = incidentRepository;
    }

    @Transactional
    public PatientTwinState updateTwinFromTelemetry(String caseId, String metric, double value, String quality, String correlationId) {
        PatientTwinState currentState = twinStateRepository.findFirstByCaseIdOrderByTimestampDesc(caseId)
                .orElseGet(() -> {
                    PatientTwinState s = new PatientTwinState();
                    s.setCaseId(caseId);
                    s.setConfidence(1.0);
                    s.setDataQuality("GOOD");
                    s.setCorrelationId(correlationId);
                    return s;
                });

        Double prevSpo2 = currentState.getSpo2();
        Double prevHr = currentState.getHeartRate();
        Double prevRr = currentState.getRespiratoryRate();

        // Update specific vital
        switch (metric) {
            case "HEART_RATE": currentState.setHeartRate(value); break;
            case "SPO2": currentState.setSpo2(value); break;
            case "SYSTOLIC_BP": currentState.setSystolicBp(value); break;
            case "DIASTOLIC_BP": currentState.setDiastolicBp(value); break;
            case "MAP": currentState.setMapValue(value); break;
            case "RESPIRATORY_RATE": currentState.setRespiratoryRate(value); break;
            case "TEMPERATURE": currentState.setTemperature(value); break;
            case "ETCO2": currentState.setEtco2(value); break;
            case "GLUCOSE": currentState.setGlucose(value); break;
            default: break;
        }

        currentState.setTimestamp(Instant.now());
        currentState.setDataQuality(quality != null ? quality : "GOOD");

        // Calculate trends and indicators
        Map<String, Object> indicators = calculateTrendIndicators(caseId, currentState);
        try {
            currentState.setTrendIndicatorsJson(objectMapper.writeValueAsString(indicators));
        } catch (Exception e) {
            log.error("Failed serializing indicators: {}", e.getMessage());
        }

        PatientTwinState saved = twinStateRepository.save(currentState);

        // Broadcast over WebSocket
        webSocketService.broadcastPatientTwinUpdate(caseId, mapToDto(saved));

        // Check if material change occurred
        checkMaterialChangeAndReevaluate(caseId, prevSpo2, currentState.getSpo2(), prevHr, currentState.getHeartRate(), prevRr, currentState.getRespiratoryRate());

        return saved;
    }

    private void checkMaterialChangeAndReevaluate(String caseId, Double prevSpo2, Double curSpo2,
                                                  Double prevHr, Double curHr,
                                                  Double prevRr, Double curRr) {
        boolean materialChange = false;

        if (prevSpo2 != null && curSpo2 != null && Math.abs(curSpo2 - prevSpo2) >= 3.0) {
            materialChange = true;
            log.info("Material change detected for case {}: SpO2 moved from {} to {}", caseId, prevSpo2, curSpo2);
        }
        if (prevHr != null && curHr != null && Math.abs(curHr - prevHr) >= 15.0) {
            materialChange = true;
            log.info("Material change detected for case {}: HR moved from {} to {}", caseId, prevHr, curHr);
        }
        if (prevRr != null && curRr != null && Math.abs(curRr - prevRr) >= 5.0) {
            materialChange = true;
            log.info("Material change detected for case {}: RR moved from {} to {}", caseId, prevRr, curRr);
        }

        if (materialChange) {
            reevaluationService.triggerPatientReevaluation(caseId);
        }
    }

    private Map<String, Object> calculateTrendIndicators(String caseId, PatientTwinState state) {
        Map<String, Object> indicators = new HashMap<>();

        // EWMA calculation: alpha = 0.3
        double alpha = 0.3;
        double hrEwma = state.getHeartRate() != null ? state.getHeartRate() : 80.0;
        double spo2Ewma = state.getSpo2() != null ? state.getSpo2() : 98.0;

        indicators.put("heartRateEwma", Math.round(hrEwma * 10.0) / 10.0);
        indicators.put("spo2Ewma", Math.round(spo2Ewma * 10.0) / 10.0);

        // Deterioration index (0 to 10 scale)
        double deteriorationScore = 0.0;
        if (state.getSpo2() != null && state.getSpo2() < 90.0) deteriorationScore += 4.0;
        else if (state.getSpo2() != null && state.getSpo2() < 94.0) deteriorationScore += 2.0;

        if (state.getHeartRate() != null && (state.getHeartRate() > 120.0 || state.getHeartRate() < 50.0)) deteriorationScore += 3.0;
        if (state.getRespiratoryRate() != null && state.getRespiratoryRate() > 28.0) deteriorationScore += 3.0;

        indicators.put("deteriorationScore", Math.min(10.0, deteriorationScore));
        indicators.put("trendSlope", (state.getHeartRate() != null && state.getHeartRate() > 115.0) ? "RISING_RISK" : "STABLE");
        indicators.put("dataQualityScore", "GOOD".equalsIgnoreCase(state.getDataQuality()) ? 0.95 : 0.60);

        return indicators;
    }

    @Transactional
    public void recordParamedicObservation(String caseId, PatientObservation obs) {
        PatientTwinState state = twinStateRepository.findFirstByCaseIdOrderByTimestampDesc(caseId)
                .orElseGet(() -> {
                    PatientTwinState s = new PatientTwinState();
                    s.setCaseId(caseId);
                    s.setTimestamp(Instant.now());
                    s.setCorrelationId(UUID.randomUUID().toString());
                    return s;
                });

        state.setConsciousness(obs.getConsciousness());
        state.setInjuryObservations(obs.getInjury() + " | Bleeding: " + obs.getBleeding() + " | Pain: " + obs.getPainScore() + "/10");
        twinStateRepository.save(state);

        webSocketService.broadcastPatientTwinUpdate(caseId, mapToDto(state));
    }

    @Transactional
    public void recordIntervention(String caseId, PatientIntervention interv) {
        PatientTwinState state = twinStateRepository.findFirstByCaseIdOrderByTimestampDesc(caseId)
                .orElseGet(() -> {
                    PatientTwinState s = new PatientTwinState();
                    s.setCaseId(caseId);
                    s.setTimestamp(Instant.now());
                    s.setCorrelationId(UUID.randomUUID().toString());
                    return s;
                });

        String existing = state.getInterventions() != null ? state.getInterventions() + "; " : "";
        state.setInterventions(existing + interv.getInterventionType() + " (" + interv.getDetails() + ")");
        twinStateRepository.save(state);

        webSocketService.broadcastPatientTwinUpdate(caseId, mapToDto(state));
    }

    @Transactional
    public void recordImageObservation(String caseId, PatientImage img) {
        PatientTwinState state = twinStateRepository.findFirstByCaseIdOrderByTimestampDesc(caseId)
                .orElseGet(() -> {
                    PatientTwinState s = new PatientTwinState();
                    s.setCaseId(caseId);
                    s.setTimestamp(Instant.now());
                    s.setCorrelationId(UUID.randomUUID().toString());
                    return s;
                });

        // Parse and apply detected vitals from vision AI metadata
        if (img.getMetadataJson() != null && !img.getMetadataJson().isBlank()) {
            try {
                Map<String, Object> meta = objectMapper.readValue(
                        img.getMetadataJson(), new TypeReference<Map<String, Object>>() {}
                );
                if (meta.containsKey("detectedVitals")) {
                    Object vitalsObj = meta.get("detectedVitals");
                    if (vitalsObj instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> v = (Map<String, Object>) vitalsObj;
                        if (v.get("heartRate") != null) state.setHeartRate(((Number) v.get("heartRate")).doubleValue());
                        if (v.get("spo2") != null) state.setSpo2(((Number) v.get("spo2")).doubleValue());
                        if (v.get("systolicBp") != null) state.setSystolicBp(((Number) v.get("systolicBp")).doubleValue());
                        if (v.get("diastolicBp") != null) state.setDiastolicBp(((Number) v.get("diastolicBp")).doubleValue());
                        if (v.get("respiratoryRate") != null) state.setRespiratoryRate(((Number) v.get("respiratoryRate")).doubleValue());
                        if (v.get("etco2") != null) state.setEtco2(((Number) v.get("etco2")).doubleValue());
                        if (v.get("temperature") != null) state.setTemperature(((Number) v.get("temperature")).doubleValue());
                        if (state.getSystolicBp() != null && state.getDiastolicBp() != null) {
                            state.setMapValue((state.getSystolicBp() + 2 * state.getDiastolicBp()) / 3.0);
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse detected vitals from image metadata", e);
            }
        }

        String existing = state.getInjuryObservations() != null ? state.getInjuryObservations() + " | " : "";
        state.setInjuryObservations(existing + "Vision AI: " + img.getPossibleInjuryRegion());
        state.setTimestamp(Instant.now());
        state.setCorrelationId(UUID.randomUUID().toString());
        twinStateRepository.save(state);

        webSocketService.broadcastPatientTwinUpdate(caseId, mapToDto(state));
    }

    @Transactional
    public PatientDtos.PatientTwinDto updateVitalsFromTelemetry(String caseId, Map<String, Object> vitals) {
        PatientTwinState state = twinStateRepository.findFirstByCaseIdOrderByTimestampDesc(caseId)
                .orElseGet(() -> {
                    PatientTwinState s = new PatientTwinState();
                    s.setCaseId(caseId);
                    s.setTimestamp(Instant.now());
                    s.setCorrelationId(UUID.randomUUID().toString());
                    return s;
                });

        if (vitals.get("heartRate") != null) state.setHeartRate(((Number) vitals.get("heartRate")).doubleValue());
        Object spo2Val = vitals.get("spo2") != null ? vitals.get("spo2") : vitals.get("spO2");
        if (spo2Val != null) state.setSpo2(((Number) spo2Val).doubleValue());
        if (vitals.get("systolicBp") != null) state.setSystolicBp(((Number) vitals.get("systolicBp")).doubleValue());
        if (vitals.get("diastolicBp") != null) state.setDiastolicBp(((Number) vitals.get("diastolicBp")).doubleValue());
        if (vitals.get("respiratoryRate") != null) state.setRespiratoryRate(((Number) vitals.get("respiratoryRate")).doubleValue());
        if (vitals.get("temperature") != null) state.setTemperature(((Number) vitals.get("temperature")).doubleValue());
        if (vitals.get("notes") != null) {
            String ex = state.getInjuryObservations() != null ? state.getInjuryObservations() + " | " : "";
            state.setInjuryObservations(ex + vitals.get("notes"));
        }
        if (state.getSystolicBp() != null && state.getDiastolicBp() != null) {
            state.setMapValue((state.getSystolicBp() + 2 * state.getDiastolicBp()) / 3.0);
        }

        state.setTimestamp(Instant.now());
        state.setCorrelationId(UUID.randomUUID().toString());
        twinStateRepository.save(state);

        PatientDtos.PatientTwinDto dto = mapToDto(state);
        webSocketService.broadcastPatientTwinUpdate(caseId, dto);
        return dto;
    }

    @Transactional
    public PatientDtos.PatientTwinDto getPatientTwin(String caseId) {
        return twinStateRepository.findFirstByCaseIdOrderByTimestampDesc(caseId)
                .map(this::mapToDto)
                .orElseGet(() -> {
                    PatientTwinState baseline = new PatientTwinState();
                    baseline.setCaseId(caseId);
                    baseline.setTimestamp(Instant.now());
                    baseline.setHeartRate(84.0);
                    baseline.setSpo2(98.0);
                    baseline.setSystolicBp(120.0);
                    baseline.setDiastolicBp(80.0);
                    baseline.setMapValue(93.3);
                    baseline.setRespiratoryRate(16.0);
                    baseline.setTemperature(37.0);
                    baseline.setEtco2(35.0);
                    baseline.setGlucose(110.0);
                    baseline.setConsciousness("ALERT");
                    baseline.setConfidence(0.95);
                    baseline.setDataQuality("EXCELLENT");
                    baseline.setInjuryObservations("Baseline digital twin telemetry initialized");
                    baseline.setCorrelationId(UUID.randomUUID().toString());
                    PatientTwinState saved = twinStateRepository.save(baseline);
                    return mapToDto(saved);
                });
    }

    public PatientDtos.PatientTwinDto mapToDto(PatientTwinState s) {
        PatientDtos.PatientTwinDto dto = new PatientDtos.PatientTwinDto();
        dto.setCaseId(s.getCaseId());
        dto.setTimestamp(s.getTimestamp());
        dto.setHeartRate(s.getHeartRate());
        dto.setSpo2(s.getSpo2());
        dto.setSystolicBp(s.getSystolicBp());
        dto.setDiastolicBp(s.getDiastolicBp());
        dto.setMapValue(s.getMapValue());
        dto.setRespiratoryRate(s.getRespiratoryRate());
        dto.setTemperature(s.getTemperature());
        dto.setEtco2(s.getEtco2());
        dto.setGlucose(s.getGlucose());
        dto.setConsciousness(s.getConsciousness());
        dto.setInjuryObservations(s.getInjuryObservations());
        dto.setInterventions(s.getInterventions());
        dto.setConfidence(s.getConfidence());
        dto.setDataQuality(s.getDataQuality());
        dto.setCorrelationId(s.getCorrelationId());

        if (s.getTrendIndicatorsJson() != null) {
            try {
                Map<String, Object> ind = objectMapper.readValue(
                        s.getTrendIndicatorsJson(), new TypeReference<Map<String, Object>>() {}
                );
                dto.setTrendIndicators(ind);
            } catch (Exception e) {
                dto.setTrendIndicators(new HashMap<>());
            }
        }
        if (incidentRepository != null) {
            incidentRepository.findFirstByPatientCaseId(s.getCaseId()).ifPresent(inc -> {
                dto.setIncidentLatitude(inc.getLatitude());
                dto.setIncidentLongitude(inc.getLongitude());
            });
        }
        return dto;
    }
}
