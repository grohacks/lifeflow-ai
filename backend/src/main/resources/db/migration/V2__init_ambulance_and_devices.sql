-- V2__init_ambulance_and_devices.sql
-- Ambulance fleet, medical devices, channels and normalized observations

CREATE TABLE IF NOT EXISTS ambulances (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    vehicle_number VARCHAR(50) NOT NULL UNIQUE,
    call_sign VARCHAR(50) NOT NULL UNIQUE,
    model VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, DISPATCHED, EN_ROUTE_SCENE, ON_SCENE, EN_ROUTE_HOSPITAL, AT_HOSPITAL, OUT_OF_SERVICE
    base_station VARCHAR(150),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS medical_devices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ambulance_id BIGINT,
    device_uid VARCHAR(100) NOT NULL UNIQUE,
    device_type VARCHAR(50) NOT NULL, -- ECG, SPO2, NIBP, RESPIRATION, TEMPERATURE, CAPNOGRAPHY, GLUCOSE, DEFIBRILLATOR, VENTILATOR, INFUSION_PUMP
    manufacturer VARCHAR(100),
    model_name VARCHAR(100),
    serial_number VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'CONNECTED', -- CONNECTED, DISCONNECTED, DEGRADED, ERROR, STANDBY
    battery_level INT DEFAULT 100,
    calibration_status VARCHAR(50) DEFAULT 'CALIBRATED',
    last_ping_at DATETIME(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_medical_devices_ambulance FOREIGN KEY (ambulance_id) REFERENCES ambulances (id) ON DELETE SET NULL,
    INDEX idx_medical_devices_ambulance (ambulance_id),
    INDEX idx_medical_devices_type (device_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS device_channels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_id BIGINT NOT NULL,
    channel_name VARCHAR(100) NOT NULL,
    metric_key VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    sample_rate_hz DOUBLE DEFAULT 1.0,
    min_physiological_limit DOUBLE,
    max_physiological_limit DOUBLE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_device_channels_device FOREIGN KEY (device_id) REFERENCES medical_devices (id) ON DELETE CASCADE,
    UNIQUE KEY uq_device_channel (device_id, metric_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sensor_observations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(100) NOT NULL UNIQUE,
    case_id VARCHAR(100) NOT NULL,
    ambulance_id BIGINT,
    device_id BIGINT,
    device_uid VARCHAR(100) NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    metric VARCHAR(50) NOT NULL,
    value DOUBLE NOT NULL,
    unit VARCHAR(30) NOT NULL,
    source_timestamp DATETIME(6) NOT NULL,
    gateway_timestamp DATETIME(6) NOT NULL,
    quality VARCHAR(30) NOT NULL DEFAULT 'GOOD', -- GOOD, DEGRADED, POOR, INVALID, STALE
    signal_quality DOUBLE DEFAULT 1.0, -- 0.0 to 1.0
    provenance VARCHAR(100) NOT NULL,
    device_status VARCHAR(50) NOT NULL,
    battery_status INT,
    calibration_status VARCHAR(50),
    sequence_number BIGINT NOT NULL,
    correlation_id VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_sensor_obs_case_metric (case_id, metric, source_timestamp),
    INDEX idx_sensor_obs_ambulance (ambulance_id, source_timestamp),
    INDEX idx_sensor_obs_device (device_id, source_timestamp),
    INDEX idx_sensor_obs_source_time (source_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
