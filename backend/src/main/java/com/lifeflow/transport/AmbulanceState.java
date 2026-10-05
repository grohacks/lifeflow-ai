package com.lifeflow.transport;

import com.lifeflow.ambulance.Ambulance;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ambulance_states")
public class AmbulanceState {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ambulance_id", nullable = false)
    private Ambulance ambulance;

    @Column(name = "case_id", length = 100)
    private String caseId;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "heading")
    private Double heading = 0.0;

    @Column(name = "speed_kmh")
    private Double speedKmh = 0.0;

    @Column(name = "cabin_temperature")
    private Double cabinTemperature;

    private Double humidity;

    @Column(name = "oxygen_supply_pct")
    private Double oxygenSupplyPct = 100.0;

    @Column(name = "edge_battery_pct")
    private Integer edgeBatteryPct = 100;

    @Column(name = "power_state", length = 50)
    private String powerState = "AC_CONNECTED";

    @Column(name = "network_signal", length = 30)
    private String networkSignal = "4G_LTE";

    @Column(name = "network_latency_ms")
    private Integer networkLatencyMs = 25;

    @Column(name = "packet_loss_pct")
    private Double packetLossPct = 0.0;

    @Column(nullable = false, length = 30)
    private String connectivity = "CONNECTED"; // CONNECTED, DISCONNECTED

    @Column(nullable = false)
    private Instant timestamp = Instant.now();

    @Column(name = "correlation_id", nullable = false, length = 100)
    private String correlationId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public AmbulanceState() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Ambulance getAmbulance() { return ambulance; }
    public void setAmbulance(Ambulance ambulance) { this.ambulance = ambulance; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public Double getHeading() { return heading; }
    public void setHeading(Double heading) { this.heading = heading; }

    public Double getSpeedKmh() { return speedKmh; }
    public void setSpeedKmh(Double speedKmh) { this.speedKmh = speedKmh; }

    public Double getCabinTemperature() { return cabinTemperature; }
    public void setCabinTemperature(Double cabinTemperature) { this.cabinTemperature = cabinTemperature; }

    public Double getHumidity() { return humidity; }
    public void setHumidity(Double humidity) { this.humidity = humidity; }

    public Double getOxygenSupplyPct() { return oxygenSupplyPct; }
    public void setOxygenSupplyPct(Double oxygenSupplyPct) { this.oxygenSupplyPct = oxygenSupplyPct; }

    public Integer getEdgeBatteryPct() { return edgeBatteryPct; }
    public void setEdgeBatteryPct(Integer edgeBatteryPct) { this.edgeBatteryPct = edgeBatteryPct; }

    public String getPowerState() { return powerState; }
    public void setPowerState(String powerState) { this.powerState = powerState; }

    public String getNetworkSignal() { return networkSignal; }
    public void setNetworkSignal(String networkSignal) { this.networkSignal = networkSignal; }

    public Integer getNetworkLatencyMs() { return networkLatencyMs; }
    public void setNetworkLatencyMs(Integer networkLatencyMs) { this.networkLatencyMs = networkLatencyMs; }

    public Double getPacketLossPct() { return packetLossPct; }
    public void setPacketLossPct(Double packetLossPct) { this.packetLossPct = packetLossPct; }

    public String getConnectivity() { return connectivity; }
    public void setConnectivity(String connectivity) { this.connectivity = connectivity; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getCorrelationId() { return correlationId; }
    public void setCorrelationId(String correlationId) { this.correlationId = correlationId; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
