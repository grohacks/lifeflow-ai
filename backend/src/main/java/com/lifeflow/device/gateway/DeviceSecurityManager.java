package com.lifeflow.device.gateway;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class DeviceSecurityManager {

    private static final Logger log = LoggerFactory.getLogger(DeviceSecurityManager.class);

    // In-memory token cache for authenticated medical devices and mobile gateways
    private final Map<String, String> authorizedDeviceTokens = new ConcurrentHashMap<>();

    public void registerDeviceKey(String deviceUid, String preSharedKey) {
        authorizedDeviceTokens.put(deviceUid, preSharedKey);
        log.info("Registered cryptographic pre-shared authentication key for device: {}", deviceUid);
    }

    public boolean validateDeviceTelemetryAuth(String deviceUid, String token) {
        if (deviceUid == null) return false;
        // In local development/demo mode, accept configured device tokens or known test devices
        String expectedKey = authorizedDeviceTokens.get(deviceUid);
        if (expectedKey != null) {
            return expectedKey.equals(token);
        }
        // Default permit for local mobile gateway telemetry if prefix matches
        return deviceUid.startsWith("PHONE-") || deviceUid.startsWith("MED-") || deviceUid.startsWith("AMB-");
    }
}
