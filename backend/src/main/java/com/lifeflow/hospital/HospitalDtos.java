package com.lifeflow.hospital;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class HospitalDtos {

    public static class HospitalDto {
        private Long id;
        private String hospitalCode;
        private String name;
        private String address;
        private Double latitude;
        private Double longitude;
        private String traumaLevel;
        private Boolean hasCathLab;
        private Boolean hasStrokeCenter;
        private Boolean hasPediatricIcu;
        private Boolean hasBurnUnit;
        private Boolean hasHelipad;
        private Boolean active;
        private String contactPhone;
        private List<HospitalResourceDto> resources;
        private HospitalTwinStateDto twinState;

        public HospitalDto() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getHospitalCode() { return hospitalCode; }
        public void setHospitalCode(String hospitalCode) { this.hospitalCode = hospitalCode; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }

        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }

        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }

        public String getTraumaLevel() { return traumaLevel; }
        public void setTraumaLevel(String traumaLevel) { this.traumaLevel = traumaLevel; }

        public Boolean getHasCathLab() { return hasCathLab; }
        public void setHasCathLab(Boolean hasCathLab) { this.hasCathLab = hasCathLab; }

        public Boolean getHasStrokeCenter() { return hasStrokeCenter; }
        public void setHasStrokeCenter(Boolean hasStrokeCenter) { this.hasStrokeCenter = hasStrokeCenter; }

        public Boolean getHasPediatricIcu() { return hasPediatricIcu; }
        public void setHasPediatricIcu(Boolean hasPediatricIcu) { this.hasPediatricIcu = hasPediatricIcu; }

        public Boolean getHasBurnUnit() { return hasBurnUnit; }
        public void setHasBurnUnit(Boolean hasBurnUnit) { this.hasBurnUnit = hasBurnUnit; }

        public Boolean getHasHelipad() { return hasHelipad; }
        public void setHasHelipad(Boolean hasHelipad) { this.hasHelipad = hasHelipad; }

        public Boolean getActive() { return active; }
        public void setActive(Boolean active) { this.active = active; }

        public String getContactPhone() { return contactPhone; }
        public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

        public List<HospitalResourceDto> getResources() { return resources; }
        public void setResources(List<HospitalResourceDto> resources) { this.resources = resources; }

        public HospitalTwinStateDto getTwinState() { return twinState; }
        public void setTwinState(HospitalTwinStateDto twinState) { this.twinState = twinState; }
    }

    public static class HospitalResourceDto {
        private Long id;
        private Long hospitalId;
        private String resourceType;
        private Integer totalCapacity;
        private Integer availableCount;
        private String status;
        private Double confidence;
        private Integer freshnessTtlSeconds;
        private Instant lastUpdatedAt;
        private boolean stale;

        public HospitalResourceDto() {}

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public Long getHospitalId() { return hospitalId; }
        public void setHospitalId(Long hospitalId) { this.hospitalId = hospitalId; }

        public String getResourceType() { return resourceType; }
        public void setResourceType(String resourceType) { this.resourceType = resourceType; }

        public Integer getTotalCapacity() { return totalCapacity; }
        public void setTotalCapacity(Integer totalCapacity) { this.totalCapacity = totalCapacity; }

        public Integer getAvailableCount() { return availableCount; }
        public void setAvailableCount(Integer availableCount) { this.availableCount = availableCount; }

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public Double getConfidence() { return confidence; }
        public void setConfidence(Double confidence) { this.confidence = confidence; }

        public Integer getFreshnessTtlSeconds() { return freshnessTtlSeconds; }
        public void setFreshnessTtlSeconds(Integer freshnessTtlSeconds) { this.freshnessTtlSeconds = freshnessTtlSeconds; }

        public Instant getLastUpdatedAt() { return lastUpdatedAt; }
        public void setLastUpdatedAt(Instant lastUpdatedAt) { this.lastUpdatedAt = lastUpdatedAt; }

        public boolean isStale() { return stale; }
        public void setStale(boolean stale) { this.stale = stale; }
    }

    public static class HospitalTwinStateDto {
        private Long hospitalId;
        private String hospitalCode;
        private String hospitalName;
        private Instant timestamp;
        private Double icuOccupancyPct;
        private Double edOccupancyPct;
        private Integer otAvailableCount;
        private Integer ventilatorAvailableCount;
        private Boolean ctScannerAvailable;
        private Boolean mriScannerAvailable;
        private Boolean specialistAvailable;
        private Boolean traumaReady;
        private String overallFreshnessStatus;
        private Double confidenceScore;
        private Map<String, Integer> projectedAtEta;

        public HospitalTwinStateDto() {}

        public Long getHospitalId() { return hospitalId; }
        public void setHospitalId(Long hospitalId) { this.hospitalId = hospitalId; }

        public String getHospitalCode() { return hospitalCode; }
        public void setHospitalCode(String hospitalCode) { this.hospitalCode = hospitalCode; }

        public String getHospitalName() { return hospitalName; }
        public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

        public Instant getTimestamp() { return timestamp; }
        public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

        public Double getIcuOccupancyPct() { return icuOccupancyPct; }
        public void setIcuOccupancyPct(Double icuOccupancyPct) { this.icuOccupancyPct = icuOccupancyPct; }

        public Double getEdOccupancyPct() { return edOccupancyPct; }
        public void setEdOccupancyPct(Double edOccupancyPct) { this.edOccupancyPct = edOccupancyPct; }

        public Integer getOtAvailableCount() { return otAvailableCount; }
        public void setOtAvailableCount(Integer otAvailableCount) { this.otAvailableCount = otAvailableCount; }

        public Integer getVentilatorAvailableCount() { return ventilatorAvailableCount; }
        public void setVentilatorAvailableCount(Integer ventilatorAvailableCount) { this.ventilatorAvailableCount = ventilatorAvailableCount; }

        public Boolean getCtScannerAvailable() { return ctScannerAvailable; }
        public void setCtScannerAvailable(Boolean ctScannerAvailable) { this.ctScannerAvailable = ctScannerAvailable; }

        public Boolean getMriScannerAvailable() { return mriScannerAvailable; }
        public void setMriScannerAvailable(Boolean mriScannerAvailable) { this.mriScannerAvailable = mriScannerAvailable; }

        public Boolean getSpecialistAvailable() { return specialistAvailable; }
        public void setSpecialistAvailable(Boolean specialistAvailable) { this.specialistAvailable = specialistAvailable; }

        public Boolean getTraumaReady() { return traumaReady; }
        public void setTraumaReady(Boolean traumaReady) { this.traumaReady = traumaReady; }

        public String getOverallFreshnessStatus() { return overallFreshnessStatus; }
        public void setOverallFreshnessStatus(String overallFreshnessStatus) { this.overallFreshnessStatus = overallFreshnessStatus; }

        public Double getConfidenceScore() { return confidenceScore; }
        public void setConfidenceScore(Double confidenceScore) { this.confidenceScore = confidenceScore; }

        public Map<String, Integer> getProjectedAtEta() { return projectedAtEta; }
        public void setProjectedAtEta(Map<String, Integer> projectedAtEta) { this.projectedAtEta = projectedAtEta; }
    }

    public static class UpdateResourceRequest {
        private String resourceType;
        private Integer availableCount;

        public UpdateResourceRequest() {}
        public UpdateResourceRequest(String resourceType, Integer availableCount) {
            this.resourceType = resourceType;
            this.availableCount = availableCount;
        }

        public String getResourceType() { return resourceType; }
        public void setResourceType(String resourceType) { this.resourceType = resourceType; }

        public Integer getAvailableCount() { return availableCount; }
        public void setAvailableCount(Integer availableCount) { this.availableCount = availableCount; }
    }

    public static class ResourceItemRequest {
        private String resourceType;
        private Integer totalCapacity;
        private Integer availableCount;

        public ResourceItemRequest() {}
        public ResourceItemRequest(String resourceType, Integer totalCapacity, Integer availableCount) {
            this.resourceType = resourceType;
            this.totalCapacity = totalCapacity;
            this.availableCount = availableCount;
        }

        public String getResourceType() { return resourceType; }
        public void setResourceType(String resourceType) { this.resourceType = resourceType; }

        public Integer getTotalCapacity() { return totalCapacity; }
        public void setTotalCapacity(Integer totalCapacity) { this.totalCapacity = totalCapacity; }

        public Integer getAvailableCount() { return availableCount; }
        public void setAvailableCount(Integer availableCount) { this.availableCount = availableCount; }
    }

    public static class CreateHospitalRequest {
        private String hospitalCode;
        private String name;
        private String address;
        private Double latitude;
        private Double longitude;
        private String traumaLevel = "LEVEL_2";
        private Boolean hasCathLab = false;
        private Boolean hasStrokeCenter = false;
        private Boolean hasPediatricIcu = false;
        private Boolean hasBurnUnit = false;
        private Boolean hasHelipad = false;
        private Boolean active = true;
        private String contactPhone;
        private List<ResourceItemRequest> resources;

        public CreateHospitalRequest() {}

        public String getHospitalCode() { return hospitalCode; }
        public void setHospitalCode(String hospitalCode) { this.hospitalCode = hospitalCode; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }

        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }

        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }

        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }

        public String getTraumaLevel() { return traumaLevel; }
        public void setTraumaLevel(String traumaLevel) { this.traumaLevel = traumaLevel; }

        public Boolean getHasCathLab() { return hasCathLab; }
        public void setHasCathLab(Boolean hasCathLab) { this.hasCathLab = hasCathLab; }

        public Boolean getHasStrokeCenter() { return hasStrokeCenter; }
        public void setHasStrokeCenter(Boolean hasStrokeCenter) { this.hasStrokeCenter = hasStrokeCenter; }

        public Boolean getHasPediatricIcu() { return hasPediatricIcu; }
        public void setHasPediatricIcu(Boolean hasPediatricIcu) { this.hasPediatricIcu = hasPediatricIcu; }

        public Boolean getHasBurnUnit() { return hasBurnUnit; }
        public void setHasBurnUnit(Boolean hasBurnUnit) { this.hasBurnUnit = hasBurnUnit; }

        public Boolean getHasHelipad() { return hasHelipad; }
        public void setHasHelipad(Boolean hasHelipad) { this.hasHelipad = hasHelipad; }

        public Boolean getActive() { return active; }
        public void setActive(Boolean active) { this.active = active; }

        public String getContactPhone() { return contactPhone; }
        public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }

        public List<ResourceItemRequest> getResources() { return resources; }
        public void setResources(List<ResourceItemRequest> resources) { this.resources = resources; }
    }

    public static class ProvisionResourceRequest {
        private String resourceType;
        private Integer totalCapacity;
        private Integer availableCount;
        private Integer freshnessTtlSeconds = 300;

        public ProvisionResourceRequest() {}
        public ProvisionResourceRequest(String resourceType, Integer totalCapacity, Integer availableCount, Integer freshnessTtlSeconds) {
            this.resourceType = resourceType;
            this.totalCapacity = totalCapacity;
            this.availableCount = availableCount;
            this.freshnessTtlSeconds = freshnessTtlSeconds != null ? freshnessTtlSeconds : 300;
        }

        public String getResourceType() { return resourceType; }
        public void setResourceType(String resourceType) { this.resourceType = resourceType; }

        public Integer getTotalCapacity() { return totalCapacity; }
        public void setTotalCapacity(Integer totalCapacity) { this.totalCapacity = totalCapacity; }

        public Integer getAvailableCount() { return availableCount; }
        public void setAvailableCount(Integer availableCount) { this.availableCount = availableCount; }

        public Integer getFreshnessTtlSeconds() { return freshnessTtlSeconds; }
        public void setFreshnessTtlSeconds(Integer freshnessTtlSeconds) { this.freshnessTtlSeconds = freshnessTtlSeconds; }
    }
}
