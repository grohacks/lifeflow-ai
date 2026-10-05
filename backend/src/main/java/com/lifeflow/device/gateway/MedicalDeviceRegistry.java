package com.lifeflow.device.gateway;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class MedicalDeviceRegistry {

    private static final Logger log = LoggerFactory.getLogger(MedicalDeviceRegistry.class);

    private final Map<String, MedicalDeviceConnector> registeredConnectors = new ConcurrentHashMap<>();

    public void registerConnector(MedicalDeviceConnector connector) {
        registeredConnectors.put(connector.getConnectorId(), connector);
        log.info("Registered Medical Device Connector: {} [Type: {}, Protocol: {}]",
                connector.getConnectorId(), connector.getDeviceType(), connector.getProtocol());
    }

    public Optional<MedicalDeviceConnector> getConnector(String connectorId) {
        return Optional.ofNullable(registeredConnectors.get(connectorId));
    }

    public Map<String, MedicalDeviceConnector> getAllConnectors() {
        return Collections.unmodifiableMap(registeredConnectors);
    }
}
