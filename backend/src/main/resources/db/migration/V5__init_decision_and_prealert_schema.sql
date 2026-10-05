-- V5__init_decision_and_prealert_schema.sql
-- Destination decision engine recommendations, evaluations, human decisions, and hospital pre-alerts

CREATE TABLE IF NOT EXISTS recommendations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recommendation_id VARCHAR(100) NOT NULL UNIQUE,
    case_id VARCHAR(100) NOT NULL,
    version_number INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    valid_until DATETIME(6) NOT NULL,
    selected_hospital_id BIGINT,
    model_version VARCHAR(50) NOT NULL,
    uncertainty_score DOUBLE NOT NULL DEFAULT 0.0,
    status VARCHAR(50) NOT NULL DEFAULT 'GENERATED', -- GENERATED, ACCEPTED, OVERRIDDEN, SUPERSEDED
    summary_reason TEXT,
    data_snapshot_json LONGTEXT,
    correlation_id VARCHAR(100) NOT NULL,
    CONSTRAINT fk_recom_hosp FOREIGN KEY (selected_hospital_id) REFERENCES hospitals (id) ON DELETE SET NULL,
    INDEX idx_recom_case_active (case_id, is_active),
    INDEX idx_recom_case_version (case_id, version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS candidate_destinations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    recommendation_id BIGINT NOT NULL,
    hospital_id BIGINT NOT NULL,
    eta_seconds INT NOT NULL,
    distance_km DOUBLE NOT NULL,
    feasibility VARCHAR(30) NOT NULL DEFAULT 'FEASIBLE', -- FEASIBLE, INFEASIBLE
    clinical_fit_score DOUBLE NOT NULL,
    future_resource_score DOUBLE NOT NULL,
    transport_utility_score DOUBLE NOT NULL,
    patient_compatibility_score DOUBLE NOT NULL,
    operational_capacity_score DOUBLE NOT NULL,
    uncertainty_penalty DOUBLE NOT NULL,
    overall_suitability_score DOUBLE NOT NULL,
    rank_order INT NOT NULL,
    is_recommended BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_cand_dest_recom FOREIGN KEY (recommendation_id) REFERENCES recommendations (id) ON DELETE CASCADE,
    CONSTRAINT fk_cand_dest_hosp FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE,
    INDEX idx_cand_dest_recom (recommendation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS destination_evaluations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    candidate_destination_id BIGINT NOT NULL UNIQUE,
    positive_factors_json TEXT,
    negative_factors_json TEXT,
    hard_constraints_json TEXT,
    uncertainty_factors_json TEXT,
    patient_forecast_summary TEXT,
    hospital_forecast_summary TEXT,
    transport_summary TEXT,
    CONSTRAINT fk_dest_eval_cand FOREIGN KEY (candidate_destination_id) REFERENCES candidate_destinations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS human_decisions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    decision_id VARCHAR(100) NOT NULL UNIQUE,
    case_id VARCHAR(100) NOT NULL,
    recommendation_id BIGINT,
    selected_hospital_id BIGINT NOT NULL,
    decision_type VARCHAR(50) NOT NULL, -- ACCEPT, SELECT_ANOTHER, OVERRIDE
    user_id BIGINT,
    user_name VARCHAR(100) NOT NULL,
    timestamp DATETIME(6) NOT NULL,
    reason TEXT,
    model_version VARCHAR(50) NOT NULL,
    correlation_id VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_human_dec_recom FOREIGN KEY (recommendation_id) REFERENCES recommendations (id) ON DELETE SET NULL,
    CONSTRAINT fk_human_dec_hosp FOREIGN KEY (selected_hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE,
    INDEX idx_human_dec_case (case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prealerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prealert_id VARCHAR(100) NOT NULL UNIQUE,
    case_id VARCHAR(100) NOT NULL,
    ambulance_id BIGINT NOT NULL,
    hospital_id BIGINT NOT NULL,
    human_decision_id BIGINT,
    eta_seconds INT NOT NULL,
    patient_summary TEXT NOT NULL,
    relevant_observations TEXT,
    interventions_performed TEXT,
    requested_capabilities TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_ACK', -- PENDING_ACK, ACKNOWLEDGED, CANCELLED
    sent_at DATETIME(6) NOT NULL,
    acknowledged_at DATETIME(6),
    acknowledged_by VARCHAR(100),
    correlation_id VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_prealert_amb FOREIGN KEY (ambulance_id) REFERENCES ambulances (id) ON DELETE CASCADE,
    CONSTRAINT fk_prealert_hosp FOREIGN KEY (hospital_id) REFERENCES hospitals (id) ON DELETE CASCADE,
    CONSTRAINT fk_prealert_human_dec FOREIGN KEY (human_decision_id) REFERENCES human_decisions (id) ON DELETE SET NULL,
    INDEX idx_prealert_hosp_status (hospital_id, status),
    INDEX idx_prealert_case (case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
