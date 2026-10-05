package com.lifeflow.hospital;

import java.util.List;
import java.util.Map;

public interface HospitalIntegrationProvider {

    Map<String, Integer> fetchCurrentResources(String hospitalCode);

    void updateResourceAvailability(String hospitalCode, String resourceType, int availableCount);

    boolean isConnected(String hospitalCode);

    String getProviderType();
}
