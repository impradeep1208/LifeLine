-- Emergency Response Optimizer - Render PostgreSQL Seed Data
-- This script populates sample data for demo purposes

-- First, let's see what users exist
-- SELECT id, username, role FROM users;

-- Sample Hospitals
INSERT INTO hospitals (id, name, latitude, longitude, address, total_beds, available_beds, contact_phone, is_active, specializations, last_updated)
VALUES 
('hosp-001', 'City General Hospital', 17.7200, 83.2950, 'Beach Road, Visakhapatnam', 200, 45, '+91-891-2345678', true, '["Emergency", "Cardiology", "Trauma"]', CURRENT_TIMESTAMP),
('hosp-002', 'Seven Hills Hospital', 17.7306, 83.3076, 'Madhurawada, Visakhapatnam', 150, 30, '+91-891-3456789', true, '["Emergency", "Neurology", "Orthopedics"]', CURRENT_TIMESTAMP),
('hosp-003', 'Care Hospital', 17.7126, 83.2986, 'Gajuwaka, Visakhapatnam', 180, 52, '+91-891-4567890', true, '["Emergency", "Pediatrics", "Surgery"]', CURRENT_TIMESTAMP),
('hosp-004', 'Apollo Hospital', 17.7450, 83.3250, 'Arilova, Visakhapatnam', 220, 60, '+91-891-5678901', true, '["Emergency", "Oncology", "Cardiology"]', CURRENT_TIMESTAMP),
('hosp-005', 'KIMS Hospital', 17.6950, 83.2750, 'MVP Colony, Visakhapatnam', 160, 38, '+91-891-6789012', true, '["Emergency", "Gastroenterology"]', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Create sample users for demo (password: password123)
INSERT INTO users (id, username, password, role, full_name, phone, email, is_active, created_at)
VALUES
('demo-traffic-001', 'officer1', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'TRAFFIC', 'Officer Rajesh', '+91-9876543210', 'rajesh@traffic.gov', true, CURRENT_TIMESTAMP),
('demo-traffic-002', 'officer2', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'TRAFFIC', 'Officer Priya', '+91-9876543211', 'priya@traffic.gov', true, CURRENT_TIMESTAMP),
('demo-ambulance-001', 'driver1', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Driver Suresh', '+91-9876543212', 'suresh@ems.com', true, CURRENT_TIMESTAMP),
('demo-ambulance-002', 'driver2', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Driver Anita', '+91-9876543213', 'anita@ems.com', true, CURRENT_TIMESTAMP),
('demo-ambulance-003', 'driver3', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Driver Ravi', '+91-9876543214', 'ravi@ems.com', true, CURRENT_TIMESTAMP),
('demo-hospital-001', 'hospital1', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Ramesh', '+91-9876543215', 'ramesh@citygen.com', true, CURRENT_TIMESTAMP),
('demo-hospital-002', 'hospital2', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Priya', '+91-9876543216', 'priya@sevenhills.com', true, CURRENT_TIMESTAMP),
('demo-hospital-003', 'carehospital', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Kumar', '+91-9876543220', 'kumar@care.com', true, CURRENT_TIMESTAMP),
('demo-hospital-004', 'apollohospital', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Reddy', '+91-9876543221', 'reddy@apollo.com', true, CURRENT_TIMESTAMP),
('demo-hospital-005', 'kimshospital', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Sharma', '+91-9876543222', 'sharma@kims.com', true, CURRENT_TIMESTAMP),
('demo-control-001', 'admin', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'CONTROL', 'Control Admin', '+91-9876543217', 'admin@ero.gov', true, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- Traffic Police
INSERT INTO traffic_police (id, officer_user_id, badge_number, current_latitude, current_longitude, status, assigned_junctions, last_updated)
VALUES
('tp-demo-001', 'demo-traffic-001', 'TP-VSP-001', 17.6868, 83.2185, 'PATROLLING', '["Beach Road", "RK Beach"]', CURRENT_TIMESTAMP),
('tp-demo-002', 'demo-traffic-002', 'TP-VSP-002', 17.7306, 83.3076, 'PATROLLING', '["Madhurawada", "Rushikonda"]', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Ambulances - Link to existing AMBULANCE users
INSERT INTO ambulances (id, vehicle_number, operator_user_id, current_latitude, current_longitude, status, equipment, last_updated)
VALUES
('amb-demo-001', 'AP-31-EMR-1001', 'demo-ambulance-001', 17.6868, 83.2185, 'AVAILABLE', '["defibrillator", "oxygen", "trauma_kit"]', CURRENT_TIMESTAMP),
('amb-demo-002', 'AP-31-EMR-1002', 'demo-ambulance-002', 17.7306, 83.3076, 'AVAILABLE', '["defibrillator", "oxygen", "ventilator"]', CURRENT_TIMESTAMP),
('amb-demo-003', 'AP-31-EMR-1003', 'demo-ambulance-003', 17.7126, 83.2986, 'AVAILABLE', '["defibrillator", "oxygen", "stretcher"]', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Link hospitals to hospital admins
UPDATE hospitals SET admin_user_id = 'demo-hospital-001' WHERE id = 'hosp-001';
UPDATE hospitals SET admin_user_id = 'demo-hospital-002' WHERE id = 'hosp-002';
UPDATE hospitals SET admin_user_id = 'demo-hospital-003' WHERE id = 'hosp-003';
UPDATE hospitals SET admin_user_id = 'demo-hospital-004' WHERE id = 'hosp-004';
UPDATE hospitals SET admin_user_id = 'demo-hospital-005' WHERE id = 'hosp-005';

-- Show summary
SELECT 'Seed data inserted successfully!' as message;
SELECT COUNT(*) as total_hospitals FROM hospitals;
SELECT COUNT(*) as total_ambulances FROM ambulances;
SELECT COUNT(*) as total_traffic_police FROM traffic_police;
SELECT COUNT(*) as total_users FROM users;

-- Test Credentials (all passwords: password123)
-- Ambulance: driver2, driver3
-- Traffic: officer1, officer2
-- Hospital: hospital1, hospital2, carehospital, apollohospital, kimshospital
-- Admin: admin
