-- V6__init_audit_and_sync_schema.sql
-- Immutable audit events, edge offline synchronization log, and AI model registry

CREATE TABLE IF NOT EXISTS audit_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_id VARCHAR(100) NOT NULL UNIQUE,
    event_type VARCHAR(100) NOT NULL,
    actor_user VARCHAR(100) NOT NULL,
    case_id VARCHAR(100),
    ambulance_id BIGINT,
    hospital_id BIGINT,
    previous_state_json LONGTEXT,
    new_state_json LONGTEXT,
    recommendation_id BIGINT,
    decision_id BIGINT,
    model_version VARCHAR(50),
    correlation_id VARCHAR(100) NOT NULL,
    timestamp DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_audit_case (case_id, timestamp),
    INDEX idx_audit_actor (actor_user, timestamp),
    INDEX idx_audit_event_type (event_type),
    INDEX idx_audit_correlation (correlation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sync_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    sync_id VARCHAR(100) NOT NULL UNIQUE,
    ambulance_id BIGINT NOT NULL,
    batch_size INT NOT NULL,
    events_received_count INT NOT NULL,
    events_deduplicated_count INT NOT NULL,
    events_persisted_count INT NOT NULL,
    sync_status VARCHAR(50) NOT NULL, -- STARTED, COMPLETED, FAILED, PARTIAL
    error_message TEXT,
    started_at DATETIME(6) NOT NULL,
    completed_at DATETIME(6),
    correlation_id VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_sync_events_amb FOREIGN KEY (ambulance_id) REFERENCES ambulances (id) ON DELETE CASCADE,
    INDEX idx_sync_events_amb (ambulance_id, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS model_versions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50) NOT NULL,
    model_type VARCHAR(50) NOT NULL, -- PATIENT_FORECAST, HOSPITAL_FORECAST, DECISION_ENGINE, VISION_ANALYSIS
    description VARCHAR(255),
    parameters_json TEXT,
    metrics_json TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_model_name_ver (model_name, model_version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Register initial system AI and algorithmic model versions
INSERT INTO model_versions (model_name, model_version, model_type, description, is_active) VALUES
    ('PatientVitalForecaster-LinearEWMA', '1.0.0', 'PATIENT_FORECAST', 'Multi-horizon linear trend + EWMA forecaster for HR, SpO2, MAP, RR', TRUE),
    ('HospitalCapacityForecaster-MMS', '1.0.0', 'HOSPITAL_FORECAST', 'M/M/s Queuing arrival & bed turnaround forecast at ETA', TRUE),
    ('DestinationDecisionEngine-MCDA', '1.0.0', 'DECISION_ENGINE', 'Multi-criteria destination suitability engine with hard constraints', TRUE),
    ('LocalVisionObservation-Baseline', '1.0.0', 'VISION_ANALYSIS', 'Transparent local color/entropy feature pipeline for trauma triage', TRUE)
ON DUPLICATE KEY UPDATE description = VALUES(description);
