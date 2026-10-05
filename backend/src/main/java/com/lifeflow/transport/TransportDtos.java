package com.lifeflow.transport;

import java.time.Instant;
import java.util.List;

public class TransportDtos {

    public static class AmbulanceStateDto {
        private Long ambulanceId;
        private String caseId;
        private Double latitude;
        private Double longitude;
        private Double heading;
        private Double speedKmh;
        private Double cabinTemperature;
        private Double humidity;
        private Double oxygenSupplyPct;
        private Integer edgeBatteryPct;
        private String powerState;
        private String networkSignal;
        private Integer networkLatencyMs;
        private Double packetLossPct;
        private String connectivity;
        private Instant timestamp;
        private String correlationId;

        public AmbulanceStateDto() {}

        public Long getAmbulanceId() { return ambulanceId; }
        public void setAmbulanceId(Long ambulanceId) { this.ambulanceId = ambulanceId; }

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
    }

    public static class RouteDto {
        private Long id;
        private Long ambulanceId;
        private Long hospitalId;
        private String hospitalName;
        private String hospitalCode;
        private Double distanceKm;
        private Integer baseDurationSeconds;
        private Double trafficMultiplier;
        private Integer calculatedEtaSeconds;
        private String waypointsJson;

        public RouteDto() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Long getAmbulanceId() { return ambulanceId; }
        public void setAmbulanceId(Long ambulanceId) { this.ambulanceId = ambulanceId; }

        public Long getHospitalId() { return hospitalId; }
        public void setHospitalId(Long hospitalId) { this.hospitalId = hospitalId; }

        public String getHospitalName() { return hospitalName; }
        public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

        public String getHospitalCode() { return hospitalCode; }
        public void setHospitalCode(String hospitalCode) { this.hospitalCode = hospitalCode; }

        public Double getDistanceKm() { return distanceKm; }
        public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

        public Integer getBaseDurationSeconds() { return baseDurationSeconds; }
        public void setBaseDurationSeconds(Integer baseDurationSeconds) { this.baseDurationSeconds = baseDurationSeconds; }

        public Double getTrafficMultiplier() { return trafficMultiplier; }
        public void setTrafficMultiplier(Double trafficMultiplier) { this.trafficMultiplier = trafficMultiplier; }

        public Integer getCalculatedEtaSeconds() { return calculatedEtaSeconds; }
        public void setCalculatedEtaSeconds(Integer calculatedEtaSeconds) { this.calculatedEtaSeconds = calculatedEtaSeconds; }

        public String getWaypointsJson() { return waypointsJson; }
        public void setWaypointsJson(String waypointsJson) { this.waypointsJson = waypointsJson; }
    }

    public static class UpdateGpsRequest {
        private Long ambulanceId;
        private String caseId;
        private Double latitude;
        private Double longitude;
        private Double heading;
        private Double speedKmh;

        public UpdateGpsRequest() {}

        public Long getAmbulanceId() { return ambulanceId; }
        public void setAmbulanceId(Long ambulanceId) { this.ambulanceId = ambulanceId; }

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
    }

    public static class UpdateTrafficRequest {
        private Long ambulanceId;
        private Double trafficMultiplier; // 1.0 (Normal), 1.2, 1.5, 2.0 (Severe)

        public UpdateTrafficRequest() {}
        public UpdateTrafficRequest(Long ambulanceId, Double trafficMultiplier) {
            this.ambulanceId = ambulanceId;
            this.trafficMultiplier = trafficMultiplier;
        }

        public Long getAmbulanceId() { return ambulanceId; }
        public void setAmbulanceId(Long ambulanceId) { this.ambulanceId = ambulanceId; }

        public Double getTrafficMultiplier() { return trafficMultiplier; }
        public void setTrafficMultiplier(Double trafficMultiplier) { this.trafficMultiplier = trafficMultiplier; }
    }
}
