package com.lifeflow.config.system;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class SystemConfigurationService {

    private final SystemConfigurationRepository repository;

    public SystemConfigurationService(SystemConfigurationRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<SystemConfiguration> getAllConfigurations() {
        return repository.findAll();
    }

    @Transactional(readOnly = true)
    public double getDoubleValue(String key, double defaultValue) {
        return repository.findByConfigKey(key)
                .map(c -> {
                    try {
                        return Double.parseDouble(c.getConfigValue());
                    } catch (NumberFormatException e) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    @Transactional
    public SystemConfiguration updateConfiguration(String key, String value, String updatedBy) {
        SystemConfiguration config = repository.findByConfigKey(key)
                .orElseThrow(() -> new IllegalArgumentException("Configuration not found: " + key));

        config.setConfigValue(value);
        config.setUpdatedBy(updatedBy != null ? updatedBy : "admin");
        config.setUpdatedAt(Instant.now());

        return repository.save(config);
    }
}
