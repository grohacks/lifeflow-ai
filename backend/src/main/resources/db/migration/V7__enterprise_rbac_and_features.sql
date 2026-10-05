-- V7__enterprise_rbac_and_features.sql
-- Enterprise RBAC (17 Roles, Granular Permissions), Organizations, Role-to-Role Messaging,
-- Alert Escalations, 12 AI Agent Traces, System Configurations, and Login Auditing

-- 1. Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL, -- AMBULANCE_SERVICE, HOSPITAL_NETWORK, DISPATCH_CONTROL, REGIONAL_AUTHORITY
    code VARCHAR(50) NOT NULL UNIQUE,
    contact_email VARCHAR(150),
    contact_phone VARCHAR(50),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default primary emergency healthcare organizations
INSERT INTO organizations (name, type, code, contact_email, contact_phone) VALUES
    ('Metro EMS Authority', 'AMBULANCE_SERVICE', 'ORG-EMS-01', 'dispatch@metroems.gov', '+1-555-0100'),
    ('Regional Trauma Hospital Network', 'HOSPITAL_NETWORK', 'ORG-HOSP-01', 'triage@regionalhealth.org', '+1-555-0200'),
    ('Central Emergency Dispatch Center', 'DISPATCH_CONTROL', 'ORG-CTRL-01', 'control@centraldispatch.gov', '+1-555-0300')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2. Link organizations to users, hospitals, ambulances, and patient cases
ALTER TABLE users ADD COLUMN organization_id BIGINT NULL;
ALTER TABLE hospitals ADD COLUMN organization_id BIGINT NULL;
ALTER TABLE ambulances ADD COLUMN organization_id BIGINT NULL;
ALTER TABLE patient_cases ADD COLUMN organization_id BIGINT NULL;

-- 3. Granular Permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- PATIENT, AMBULANCE, HOSPITAL, DESTINATION, PREALERT, MESSAGE, ALERT, AGENT, AUDIT, ADMIN
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Role to Permissions mapping table
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_perm_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
    CONSTRAINT fk_role_perm_perm FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed all 30+ granular permissions
INSERT INTO permissions (name, description, category) VALUES
    ('PATIENT_VIEW', 'View patient digital twins, vitals, and case history', 'PATIENT'),
    ('PATIENT_CREATE', 'Create new emergency patient cases', 'PATIENT'),
    ('PATIENT_UPDATE', 'Update patient demographic and clinical information', 'PATIENT'),
    ('PATIENT_OBSERVATION_CREATE', 'Log primary and secondary survey clinical observations', 'PATIENT'),
    ('PATIENT_INTERVENTION_CREATE', 'Record en route medical interventions and medications', 'PATIENT'),
    ('PATIENT_IMAGE_UPLOAD', 'Upload bedside ultrasound and diagnostic imagery', 'PATIENT'),
    ('AMBULANCE_VIEW', 'View ambulance vehicle status and fleet locations', 'AMBULANCE'),
    ('AMBULANCE_ASSIGN', 'Assign field crew and devices to ambulances', 'AMBULANCE'),
    ('AMBULANCE_TELEMETRY_VIEW', 'Inspect live mobile sensor and cabin telemetry', 'AMBULANCE'),
    ('HOSPITAL_VIEW', 'View regional hospital facilities and capabilities', 'HOSPITAL'),
    ('HOSPITAL_RESOURCE_UPDATE', 'Update live ICU, ED bay, OT, and ventilator capacity', 'HOSPITAL'),
    ('DESTINATION_VIEW', 'Inspect candidate hospital rankings and ETAs', 'DESTINATION'),
    ('DESTINATION_EVALUATE', 'Trigger algorithmic multi-criteria destination evaluations', 'DESTINATION'),
    ('DESTINATION_DECIDE', 'Confirm human decision and destination acceptance', 'DESTINATION'),
    ('DESTINATION_OVERRIDE', 'Clinically override algorithmic recommendations with rationale', 'DESTINATION'),
    ('PREALERT_CREATE', 'Dispatch emergency hospital pre-alerts', 'PREALERT'),
    ('PREALERT_ACKNOWLEDGE', 'Acknowledge incoming pre-alerts and reserve resuscitation bays', 'PREALERT'),
    ('MESSAGE_SEND', 'Send role-to-role case communication messages', 'MESSAGE'),
    ('MESSAGE_VIEW', 'View case communication history and notifications', 'MESSAGE'),
    ('ALERT_VIEW', 'View active clinical, transport, and device alerts', 'ALERT'),
    ('ALERT_ACKNOWLEDGE', 'Acknowledge and resolve clinical alerts', 'ALERT'),
    ('AGENT_VIEW', 'Inspect AI agent runs, traces, and tool calls', 'AGENT'),
    ('AGENT_EXECUTE', 'Manually trigger operational assistance agents', 'AGENT'),
    ('AUDIT_VIEW', 'Inspect and export cryptographically verified audit trails', 'AUDIT'),
    ('USER_MANAGE', 'Create, update, and deactivate staff user accounts', 'ADMIN'),
    ('ROLE_MANAGE', 'Manage role assignments and permission grants', 'ADMIN'),
    ('DEVICE_MANAGE', 'Register and manage mobile and medical sensor gateways', 'ADMIN'),
    ('SYSTEM_CONFIGURE', 'Update vital thresholds, scoring weights, and freshness limits', 'ADMIN'),
    ('MODEL_MANAGE', 'Register and inspect AI model versions and metrics', 'ADMIN'),
    ('INTEGRATION_MANAGE', 'Configure and test MQTT, Ollama, and FHIR connectors', 'ADMIN')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Seed all 17 system roles per Section 5
INSERT INTO roles (name, description) VALUES
    ('ROLE_SUPER_ADMIN', 'Super Administrator with unrestricted root authority across all organizations'),
    ('ROLE_ADMIN', 'Platform Administrator managing organization configuration, devices, and users'),
    ('ROLE_PARAMEDIC', 'Lead Paramedic managing en route patient care, interventions, and destination confirmation'),
    ('ROLE_AMBULANCE_DRIVER', 'Ambulance Driver monitoring navigation, vehicle telemetry, and traffic corridors'),
    ('ROLE_CONTROL_ROOM_OPERATOR', 'Control Room Operator coordinating regional fleet movements and traffic bottlenecks'),
    ('ROLE_DISPATCHER', 'Emergency Services Dispatcher managing 911/112 call intake and ambulance assignments'),
    ('ROLE_HOSPITAL_OPERATOR', 'Hospital ED Coordinator managing live bed resources and pre-alert bay reservations'),
    ('ROLE_EMERGENCY_PHYSICIAN', 'Emergency Attending Physician overseeing pre-hospital interventions and trauma intake'),
    ('ROLE_CLINICIAN', 'Clinical Specialist reviewing multi-horizon AI vital deterioration predictions'),
    ('ROLE_NURSE', 'Triage and Trauma Bay Nurse preparing equipment and blood units before arrival'),
    ('ROLE_MEDICAL_SUPERVISOR', 'Medical Director overseeing clinical governance, protocol compliance, and overrides'),
    ('ROLE_BIOMEDICAL_ENGINEER', 'Biomedical Engineer managing device calibration, telemetry gateways, and sensors'),
    ('ROLE_AI_OPERATOR', 'AI & Model Engineer monitoring model drift, Ollama pipelines, and inference health'),
    ('ROLE_SYSTEM_OPERATOR', 'DevOps & Infrastructure Operator monitoring MQTT, MySQL, and services uptime'),
    ('ROLE_AUDITOR', 'Compliance and Regulatory Officer reviewing immutable SHA-256 audit records'),
    ('ROLE_RESEARCHER', 'Clinical Researcher analyzing anonymized outcomes and decision efficacy'),
    ('ROLE_VIEWER', 'Read-only observer for training, demonstrations, and dashboard monitoring')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- 5. Case-based role-to-role messaging
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id VARCHAR(100) NOT NULL UNIQUE,
    case_id VARCHAR(100) NOT NULL,
    sender_user VARCHAR(100) NOT NULL,
    sender_role VARCHAR(50) NOT NULL,
    priority VARCHAR(30) NOT NULL DEFAULT 'ROUTINE', -- ROUTINE, URGENT, EMERGENCY
    content TEXT NOT NULL,
    attachment_type VARCHAR(50), -- IMAGE, ECG, VITALS_SNAPSHOT, DESTINATION_EVAL
    attachment_ref VARCHAR(255),
    timestamp DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_messages_case (case_id, timestamp),
    INDEX idx_messages_sender (sender_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS message_recipients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT NOT NULL,
    recipient_role VARCHAR(50) NOT NULL,
    recipient_user VARCHAR(100),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at DATETIME(6),
    CONSTRAINT fk_msg_recip_msg FOREIGN KEY (message_id) REFERENCES messages (id) ON DELETE CASCADE,
    INDEX idx_msg_recip_role (recipient_role, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Alerts and multi-tier escalation engine
CREATE TABLE IF NOT EXISTS alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    alert_id VARCHAR(100) NOT NULL UNIQUE,
    case_id VARCHAR(100),
    ambulance_id BIGINT,
    hospital_id BIGINT,
    alert_type VARCHAR(50) NOT NULL, -- CRITICAL_VITAL_CHANGE, PATIENT_DETERIORATION, GPS_LOST, NETWORK_LOST, DEVICE_FAILURE, ETA_CHANGED, HOSPITAL_RESOURCE_CHANGED, HOSPITAL_DATA_STALE, DESTINATION_CHANGED, PREALERT_PENDING, SYSTEM_ERROR
    severity VARCHAR(30) NOT NULL DEFAULT 'WARNING', -- INFO, WATCH, WARNING, CRITICAL, DATA_QUALITY_ALERT
    message TEXT NOT NULL,
    source VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, ACKNOWLEDGED, ESCALATED, RESOLVED
    acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    acknowledged_by VARCHAR(100),
    acknowledged_at DATETIME(6),
    timestamp DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_alerts_status (status, severity),
    INDEX idx_alerts_case (case_id, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS alert_escalations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    alert_id BIGINT NOT NULL,
    escalation_level INT NOT NULL, -- 1: Field/Triage, 2: Control Room, 3: Supervisor, 4: Clinician
    escalated_to_role VARCHAR(50) NOT NULL,
    escalation_reason VARCHAR(255) NOT NULL,
    escalated_at DATETIME(6) NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_escalation_alert FOREIGN KEY (alert_id) REFERENCES alerts (id) ON DELETE CASCADE,
    INDEX idx_escalation_alert (alert_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 12 Agent execution traces and tool registry
CREATE TABLE IF NOT EXISTS agent_runs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    run_id VARCHAR(100) NOT NULL UNIQUE,
    agent_id VARCHAR(50) NOT NULL,
    agent_name VARCHAR(100) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL, -- TELEMETRY_INGRESS, DETERIORATION_EVENT, REASSESSMENT_TICK, MANUAL_PROMPT
    case_id VARCHAR(100),
    model VARCHAR(100) NOT NULL DEFAULT 'local-deterministic',
    model_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    input_snapshot_json LONGTEXT,
    structured_output_json LONGTEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED', -- RUNNING, COMPLETED, FAILED, REQUIRES_APPROVAL
    requires_human_approval BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by VARCHAR(100),
    approved_at DATETIME(6),
    execution_time_ms INT NOT NULL DEFAULT 0,
    timestamp DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_agent_runs_agent (agent_id, timestamp),
    INDEX idx_agent_runs_case (case_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agent_tools (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    agent_run_id BIGINT NOT NULL,
    tool_name VARCHAR(100) NOT NULL,
    parameters_json TEXT,
    result_json LONGTEXT,
    execution_time_ms INT DEFAULT 0,
    timestamp DATETIME(6) NOT NULL,
    CONSTRAINT fk_agent_tool_run FOREIGN KEY (agent_run_id) REFERENCES agent_runs (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Dynamic configuration engine
CREATE TABLE IF NOT EXISTS system_configurations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL, -- VITAL_THRESHOLDS, SCORING_WEIGHTS, TIMERS, FRESHNESS_LIMITS
    description VARCHAR(255),
    updated_by VARCHAR(100) NOT NULL DEFAULT 'system',
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed default clinical and operational configuration values
INSERT INTO system_configurations (config_key, config_value, category, description) VALUES
    ('vital.hr.tachycardia.threshold', '120', 'VITAL_THRESHOLDS', 'Heart rate threshold for tachycardia alert (bpm)'),
    ('vital.hr.bradycardia.threshold', '50', 'VITAL_THRESHOLDS', 'Heart rate threshold for bradycardia alert (bpm)'),
    ('vital.spo2.hypoxia.threshold', '90', 'VITAL_THRESHOLDS', 'SpO2 threshold for hypoxia warning (%)'),
    ('vital.bp.hypotension.threshold', '90', 'VITAL_THRESHOLDS', 'Systolic BP threshold for shock alert (mmHg)'),
    ('weights.clinical_fit', '0.35', 'SCORING_WEIGHTS', 'Destination scoring weight for specialty & trauma level match'),
    ('weights.future_resources', '0.25', 'SCORING_WEIGHTS', 'Destination scoring weight for projected bed/OT availability at ETA'),
    ('weights.transport_utility', '0.20', 'SCORING_WEIGHTS', 'Destination scoring weight for travel duration & traffic penalty'),
    ('weights.operational_capacity', '0.10', 'SCORING_WEIGHTS', 'Destination scoring weight for ED surge capacity'),
    ('weights.uncertainty_penalty', '0.10', 'SCORING_WEIGHTS', 'Penalty weight applied for stale data or sensor dropout'),
    ('hospital.freshness_ttl_seconds', '900', 'FRESHNESS_LIMITS', 'Hospital bed data considered STALE if older than 15 minutes (900s)'),
    ('escalation.tier1_timeout_seconds', '120', 'TIMERS', 'Seconds before unacknowledged critical alert escalates to Control Room'),
    ('escalation.tier2_timeout_seconds', '300', 'TIMERS', 'Seconds before alert escalates to Medical Supervisor')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

-- 9. Login history and security tracking
CREATE TABLE IF NOT EXISTS login_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    status VARCHAR(30) NOT NULL, -- SUCCESS, FAILED_CREDENTIALS, ACCOUNT_LOCKED, EXPIRED_TOKEN
    failure_reason VARCHAR(255),
    timestamp DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_login_history_user (username, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Ensure audit_events has integrity hash column
ALTER TABLE audit_events ADD COLUMN integrity_hash VARCHAR(64) NULL;
