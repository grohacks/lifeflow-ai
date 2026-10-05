-- V9__hospital_reservation_and_doctor_orders.sql
-- Add hospital code and department to users table
ALTER TABLE users ADD COLUMN hospital_code VARCHAR(50) NULL;
ALTER TABLE users ADD COLUMN department VARCHAR(100) NULL;

-- Add resource reservation and doctor directive fields to prealerts table
ALTER TABLE prealerts ADD COLUMN reserved_beds VARCHAR(200) NULL;
ALTER TABLE prealerts ADD COLUMN reserved_blood_units INT NULL;
ALTER TABLE prealerts ADD COLUMN reserved_equipment VARCHAR(200) NULL;
ALTER TABLE prealerts ADD COLUMN assigned_doctor_name VARCHAR(150) NULL;
ALTER TABLE prealerts ADD COLUMN doctor_notified BOOLEAN DEFAULT FALSE;
ALTER TABLE prealerts ADD COLUMN doctor_notified_at DATETIME(6) NULL;
ALTER TABLE prealerts ADD COLUMN doctor_orders TEXT NULL;
