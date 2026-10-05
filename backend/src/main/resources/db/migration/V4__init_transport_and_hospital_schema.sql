-- V4__init_transport_and_hospital_schema.sql
-- Transport digital twin, route tracking, hospitals, and hospital digital twins

CREATE TABLE IF NOT EXISTS ambulance_states (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ambulance_id BIGINT NOT NULL,
    case_id VARCHAR(100),
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    heading DOUBLE DEFAULT 0.0,
    speed_kmh DOUBLE DEFAULT 0.0,
    cabin_temperature DOUBLE,
    humidity DOUBLE,
    oxygen_supply_pct DOUBLE DEFAULT 100.0,
    edge_battery_pct INT DEFAULT 100,
    power_state VARCHAR(50) DEFAULT 'AC_CONNECTED',
    network_signal VARCHAR(30) DEFAULT '4G_LTE',
    network_latency_ms INT DEFAULT 25,
    packet_loss_pct DOUBLE DEFAULT 0.0,
    connectivity VARCHAR(30) NOT NULL DEFAULT 'CONNECTED', -- CONNECTED, DISCONNECTED
    timestamp DATETIME(6) NOT NULL,
    correlation_id VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_ambulance_states_ambulance FOREIGN KEY (ambulance_id) REFERENCES ambulances (id) ON DELETE CASCADE,
    INDEX idx_amb_states_amb_time (ambulance_id, timestamp),
    INDEX idx_amb_states_case (case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hospitals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hospital_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    trauma_level VARCHAR(30) NOT NULL, -- LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, NONE
    has_cath_lab BOOLEAN NOT NULL DEFAULT FALSE,
    has_stroke_center BOOLEAN NOT NULL DEFAULT FALSE,
    has_pediatric_icu BOOLEAN NOT NULL DEFAULT FALSE,
    has_burn_unit BOOLEAN NOT NULL DEFAULT FALSE,
    has_helipad BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    contact_phone VARCHAR(50),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_hospitals_code (hospital_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS routes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ambulance_id BIGINT NOT NULL,
    hospital_id BIGINT NOT NULL,
    distance_km DOUBLE NOT NULL,
    base_duration_seconds INT NOT NULL,
    traffic_multiplier DOUBLE NOT NULL DEFAULT 1.0, -- 1.0 (Normal), 1.2 (Moderate), 1.5 (Heavy), 2.0 (Severe)
    calculated_eta_seconds INT NOT NULL,
    waypoints_json LONGTEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_routes_ambulance FOREIGN KEY (ambulance_id) REFERENCES ambulances (id) ON DELETE CASCADE,
    CONSTRAINT fk_routes_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE,
    INDEX idx_routes_amb_hosp (ambulance_id, hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hospital_resources (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hospital_id BIGINT NOT NULL,
    resource_type VARCHAR(50) NOT NULL, -- ICU_BEDS, ED_BEDS, OT_THEATRES, VENTILATORS, CT_SCANNERS, MRI_SCANNERS, BLOOD_BANK_UNITS, CARDIOLOGIST, NEUROLOGIST, TRAUMA_SURGEON
    total_capacity INT NOT NULL,
    available_count INT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, STALE, UNAVAILABLE, CRITICAL
    confidence DOUBLE NOT NULL DEFAULT 1.0,
    freshness_ttl_seconds INT NOT NULL DEFAULT 300, -- 5 minutes
    last_updated_at DATETIME(6) NOT NULL,
    source VARCHAR(100) NOT NULL DEFAULT 'HOSPITAL_EHR_INTERFACE',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_hospital_resources_hosp FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE,
    UNIQUE KEY uq_hosp_resource (hospital_id, resource_type),
    INDEX idx_hosp_resources_type (resource_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hospital_resource_snapshots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hospital_id BIGINT NOT NULL,
    snapshot_time DATETIME(6) NOT NULL,
    resources_json TEXT NOT NULL,
    correlation_id VARCHAR(100),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_hosp_res_snap_hosp FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE,
    INDEX idx_hosp_snapshots_time (hospital_id, snapshot_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS hospital_twin_states (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hospital_id BIGINT NOT NULL,
    timestamp DATETIME(6) NOT NULL,
    icu_occupancy_pct DOUBLE,
    ed_occupancy_pct DOUBLE,
    ot_available_count INT,
    ventilator_available_count INT,
    ct_scanner_available BOOLEAN,
    mri_scanner_available BOOLEAN,
    specialist_available BOOLEAN,
    trauma_ready BOOLEAN,
    overall_freshness_status VARCHAR(30) NOT NULL DEFAULT 'CURRENT', -- CURRENT, STALE, EXPIRED
    confidence_score DOUBLE NOT NULL DEFAULT 1.0,
    correlation_id VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_hosp_twin_hosp FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE,
    INDEX idx_hosp_twin_time (hospital_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
