package com.lifeflow.device;

import java.util.List;
import java.util.Map;

public interface MedicalDeviceAdapter {

    boolean connect();

    boolean disconnect();

    Map<String, Object> getDeviceInfo();

    String getStatus();

    List<DeviceDtos.ObservationEventDto> generateObservations(String caseId, Long sequenceNumber, String correlationId);

    String getDeviceType();

    String getDeviceUid();
}
