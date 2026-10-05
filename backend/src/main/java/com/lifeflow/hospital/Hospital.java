package com.lifeflow.hospital;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "hospitals")
public class Hospital {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "hospital_code", nullable = false, unique = true, length = 50)
    private String hospitalCode;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 255)
    private String address;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(name = "trauma_level", nullable = false, length = 30)
    private String traumaLevel; // LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, NONE

    @Column(name = "has_cath_lab", nullable = false)
    private Boolean hasCathLab = false;

    @Column(name = "has_stroke_center", nullable = false)
    private Boolean hasStrokeCenter = false;

    @Column(name = "has_pediatric_icu", nullable = false)
    private Boolean hasPediatricIcu = false;

    @Column(name = "has_burn_unit", nullable = false)
    private Boolean hasBurnUnit = false;

    @Column(name = "has_helipad", nullable = false)
    private Boolean hasHelipad = false;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "contact_phone", length = 50)
    private String contactPhone;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Hospital() {}

    public Hospital(String hospitalCode, String name, String address, Double latitude, Double longitude,
                    String traumaLevel, Boolean hasCathLab, Boolean hasStrokeCenter) {
        this.hospitalCode = hospitalCode;
        this.name = name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.traumaLevel = traumaLevel;
        this.hasCathLab = hasCathLab;
        this.hasStrokeCenter = hasStrokeCenter;
        this.active = true;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

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

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
