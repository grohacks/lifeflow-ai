-- V8: Emergency Incidents & Citizen SOS Dispatch Schema

CREATE TABLE IF NOT EXISTS emergency_incidents (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    incident_code VARCHAR(50) NOT NULL UNIQUE,
    bystander_name VARCHAR(100),
    bystander_phone VARCHAR(50),
    incident_type VARCHAR(50) NOT NULL DEFAULT 'ROAD_ACCIDENT',
    severity VARCHAR(20) NOT NULL DEFAULT 'CRITICAL',
    casualty_count INT NOT NULL DEFAULT 1,
    description TEXT,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    location_address VARCHAR(255),
    photo_url MEDIUMTEXT,
    assigned_ambulance_id BIGINT,
    status VARCHAR(30) NOT NULL DEFAULT 'REPORTED',
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dispatched_at TIMESTAMP NULL,
    arrived_scene_at TIMESTAMP NULL,
    patient_case_id VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_incident_status (status),
    INDEX idx_incident_ambulance (assigned_ambulance_id),
    INDEX idx_incident_reported (reported_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial sample incident for quick demo/testing if not exists
INSERT INTO emergency_incidents (
    incident_code, bystander_name, bystander_phone, incident_type, severity, casualty_count,
    description, latitude, longitude, location_address, assigned_ambulance_id, status, reported_at
) VALUES (
    'INC-2026-001', 'Rahul Verma', '+91 98765 43210', 'ROAD_ACCIDENT', 'CRITICAL', 1,
    'High-speed two-wheeler collision with divider. Rider unconscious with head laceration.',
    12.9716, 77.5946, 'MG Road Junction, near Metro Station', 1, 'ASSIGNED', CURRENT_TIMESTAMP
) ON DUPLICATE KEY UPDATE incident_code=incident_code;
