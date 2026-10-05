package com.lifeflow.config.system;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "system_configurations")
public class SystemConfiguration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "config_key", nullable = false, unique = true, length = 100)
    private String configKey;

    @Column(name = "config_value", nullable = false, length = 255)
    private String configValue;

    @Column(nullable = false, length = 50)
    private String category; // VITAL_THRESHOLDS, SCORING_WEIGHTS, TIMERS, FRESHNESS_LIMITS

    @Column(length = 255)
    private String description;

    @Column(name = "updated_by", nullable = false, length = 100)
    private String updatedBy = "system";

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public SystemConfiguration() {}

    public SystemConfiguration(String configKey, String configValue, String category, String description) {
        this.configKey = configKey;
        this.configValue = configValue;
        this.category = category;
        this.description = description;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getConfigKey() { return configKey; }
    public void setConfigKey(String configKey) { this.configKey = configKey; }

    public String getConfigValue() { return configValue; }
    public void setConfigValue(String configValue) { this.configValue = configValue; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
