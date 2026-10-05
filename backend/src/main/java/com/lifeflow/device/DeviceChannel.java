package com.lifeflow.device;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "device_channels")
public class DeviceChannel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private MedicalDevice device;

    @Column(name = "channel_name", nullable = false, length = 100)
    private String channelName;

    @Column(name = "metric_key", nullable = false, length = 100)
    private String metricKey;

    @Column(nullable = false, length = 50)
    private String unit;

    @Column(name = "sample_rate_hz")
    private Double sampleRateHz = 1.0;

    @Column(name = "min_physiological_limit")
    private Double minPhysiologicalLimit;

    @Column(name = "max_physiological_limit")
    private Double maxPhysiologicalLimit;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public DeviceChannel() {}

    public DeviceChannel(MedicalDevice device, String channelName, String metricKey, String unit,
                         Double sampleRateHz, Double minLimit, Double maxLimit) {
        this.device = device;
        this.channelName = channelName;
        this.metricKey = metricKey;
        this.unit = unit;
        this.sampleRateHz = sampleRateHz;
        this.minPhysiologicalLimit = minLimit;
        this.maxPhysiologicalLimit = maxLimit;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public MedicalDevice getDevice() { return device; }
    public void setDevice(MedicalDevice device) { this.device = device; }

    public String getChannelName() { return channelName; }
    public void setChannelName(String channelName) { this.channelName = channelName; }

    public String getMetricKey() { return metricKey; }
    public void setMetricKey(String metricKey) { this.metricKey = metricKey; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Double getSampleRateHz() { return sampleRateHz; }
    public void setSampleRateHz(Double sampleRateHz) { this.sampleRateHz = sampleRateHz; }

    public Double getMinPhysiologicalLimit() { return minPhysiologicalLimit; }
    public void setMinPhysiologicalLimit(Double minPhysiologicalLimit) { this.minPhysiologicalLimit = minPhysiologicalLimit; }

    public Double getMaxPhysiologicalLimit() { return maxPhysiologicalLimit; }
    public void setMaxPhysiologicalLimit(Double maxPhysiologicalLimit) { this.maxPhysiologicalLimit = maxPhysiologicalLimit; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
