-- V3__init_patient_schema.sql
-- Patient cases, observations, interventions, images, digital twin states, and forecasts

CREATE TABLE IF NOT EXISTS patient_cases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(100) NOT NULL UNIQUE,
    ambulance_id BIGINT,
    patient_identifier VARCHAR(100),
    age INT,
    gender VARCHAR(20),
    chief_complaint VARCHAR(255),
    triage_category VARCHAR(50) DEFAULT 'RED', -- RED (Immediate), YELLOW (Urgent), GREEN (Delayed), BLACK (Deceased)
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, TRANSFERRED, RESOLVED, CANCELLED
    started_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    closed_at DATETIME(6),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_patient_cases_ambulance FOREIGN KEY (ambulance_id) REFERENCES ambulances (id) ON DELETE SET NULL,
    INDEX idx_patient_cases_status (status),
    INDEX idx_patient_cases_ambulance (ambulance_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patient_observations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    observation_id VARCHAR(100) NOT NULL UNIQUE,
    case_id VARCHAR(100) NOT NULL,
    recorded_by VARCHAR(100) NOT NULL,
    consciousness VARCHAR(50), -- ALERT, VERBAL, PAIN, UNRESPONSIVE (AVPU) or GCS score
    airway VARCHAR(50), -- CLEAR, OBSTRUCTED, MAINTAINED
    breathing VARCHAR(50), -- NORMAL, SHALLOW, LABORED, AGONAL, APNEIC
    circulation VARCHAR(50), -- STRONG, WEAK, ABSENT, IRREGULAR
    injury VARCHAR(255),
    bleeding VARCHAR(100), -- NONE, MINOR, CONTROLLED, SEVERE_ACTIVE
    pain_score INT, -- 0 to 10
    notes TEXT,
    timestamp DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_patient_obs_case (case_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patient_interventions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    intervention_id VARCHAR(100) NOT NULL UNIQUE,
    case_id VARCHAR(100) NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    intervention_type VARCHAR(100) NOT NULL, -- OXYGEN_THERAPY, INTUBATION, CPR, DEFIBRILLATION, MEDICATION, IV_ACCESS, IMMOBILIZATION, WOUND_PACKING
    details TEXT,
    dose VARCHAR(100),
    route VARCHAR(50),
    timestamp DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_patient_interv_case (case_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patient_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    image_id VARCHAR(100) NOT NULL UNIQUE,
    case_id VARCHAR(100) NOT NULL,
    uploader VARCHAR(100) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    checksum VARCHAR(100) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    analysis_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, ANALYZED, FAILED
    possible_injury_region VARCHAR(100),
    possible_visible_bleeding VARCHAR(100),
    confidence DOUBLE,
    requires_human_confirmation VARCHAR(150) DEFAULT 'AI observation — requires human confirmation',
    metadata_json TEXT,
    timestamp DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_patient_images_case (case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patient_twin_states (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(100) NOT NULL,
    timestamp DATETIME(6) NOT NULL,
    heart_rate DOUBLE,
    spo2 DOUBLE,
    systolic_bp DOUBLE,
    diastolic_bp DOUBLE,
    map_value DOUBLE,
    respiratory_rate DOUBLE,
    temperature DOUBLE,
    etco2 DOUBLE,
    glucose DOUBLE,
    consciousness VARCHAR(50),
    injury_observations TEXT,
    interventions TEXT,
    confidence DOUBLE NOT NULL DEFAULT 1.0,
    data_quality VARCHAR(30) NOT NULL DEFAULT 'GOOD',
    trend_indicators_json TEXT, -- Moving average, slope, z-scores, deterioration score
    correlation_id VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_patient_twin_case_time (case_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patient_forecasts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(100) NOT NULL,
    horizon_minutes INT NOT NULL, -- 5, 10, 15, 20, 30
    forecast_timestamp DATETIME(6) NOT NULL,
    metric VARCHAR(50) NOT NULL, -- HEART_RATE, SPO2, MAP, RESPIRATORY_RATE
    forecast_value DOUBLE,
    lower_bound DOUBLE,
    upper_bound DOUBLE,
    confidence DOUBLE NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED', -- COMPLETED, INSUFFICIENT_DATA
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_patient_forecast_case (case_id, horizon_minutes, metric)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
