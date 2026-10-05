package com.lifeflow.hospital;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class SimulatedHospitalIntegrationProvider implements HospitalIntegrationProvider {

    private final Map<String, Map<String, Integer>> hospitalResources = new ConcurrentHashMap<>();

    @Override
    public Map<String, Integer> fetchCurrentResources(String hospitalCode) {
        return hospitalResources.getOrDefault(hospitalCode, new HashMap<>());
    }

    @Override
    public void updateResourceAvailability(String hospitalCode, String resourceType, int availableCount) {
        hospitalResources.computeIfAbsent(hospitalCode, k -> new ConcurrentHashMap<>())
                .put(resourceType, availableCount);
    }

    @Override
    public boolean isConnected(String hospitalCode) {
        return true;
    }

    @Override
    public String getProviderType() {
        return "SIMULATED_HOSPITAL_PROVIDER";
    }
}
