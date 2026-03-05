-- Add missing hospital admin users for all hospitals
-- Password for all: password123

-- Care Hospital admin
INSERT INTO users (id, username, password, role, full_name, phone, email, is_active, created_at)
VALUES
('demo-hospital-003', 'carehospital', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Kumar', '+91-9876543220', 'kumar@care.com', true, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- Apollo Hospital admin
INSERT INTO users (id, username, password, role, full_name, phone, email, is_active, created_at)
VALUES
('demo-hospital-004', 'apollohospital', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Reddy', '+91-9876543221', 'reddy@apollo.com', true, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- KIMS Hospital admin
INSERT INTO users (id, username, password, role, full_name, phone, email, is_active, created_at)
VALUES
('demo-hospital-005', 'kimshospital', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Sharma', '+91-9876543222', 'sharma@kims.com', true, CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;

-- Link hospital admins to hospitals
UPDATE hospitals SET admin_user_id = 'demo-hospital-003' WHERE id = 'hosp-003';
UPDATE hospitals SET admin_user_id = 'demo-hospital-004' WHERE id = 'hosp-004';
UPDATE hospitals SET admin_user_id = 'demo-hospital-005' WHERE id = 'hosp-005';

-- Verify
SELECT h.name, h.admin_user_id, u.username, u.full_name 
FROM hospitals h 
LEFT JOIN users u ON h.admin_user_id = u.id
ORDER BY h.id;

-- Login Credentials (all password: password123)
-- City General Hospital: username = hospital1
-- Seven Hills Hospital: username = hospital2
-- Care Hospital: username = carehospital
-- Apollo Hospital: username = apollohospital
-- KIMS Hospital: username = kimshospital
