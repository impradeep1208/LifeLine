-- Emergency Response Optimizer - Initial Data Script
-- Run this after first application startup to populate sample data

USE ero_db;

-- Clear existing data (to allow re-running this script)
DELETE FROM traffic_assignments;
DELETE FROM emergencies;
DELETE FROM traffic_police;
DELETE FROM ambulances;
DELETE FROM hospitals;
DELETE FROM users WHERE role IN ('TRAFFIC', 'AMBULANCE', 'HOSPITAL', 'CONTROL', 'CITIZEN');

-- Sample Hospitals
INSERT INTO hospitals (id, name, latitude, longitude, address, total_beds, available_beds, contact_phone, is_active, specializations, last_updated)
VALUES 
('hosp-001', 'City General Hospital', 17.7200, 83.2950, 'Beach Road, Visakhapatnam', 200, 45, '+91-891-2345678', true, '["Emergency", "Cardiology", "Trauma"]', NOW()),
('hosp-002', 'Seven Hills Hospital', 17.7306, 83.3076, 'Madhurawada, Visakhapatnam', 150, 30, '+91-891-3456789', true, '["Emergency", "Neurology", "Orthopedics"]', NOW()),
('hosp-003', 'Care Hospital', 17.7126, 83.2986, 'Gajuwaka, Visakhapatnam', 180, 52, '+91-891-4567890', true, '["Emergency", "Pediatrics", "Surgery"]', NOW()),
('hosp-004', 'Apollo Hospital', 17.7450, 83.3250, 'Arilova, Visakhapatnam', 220, 60, '+91-891-5678901', true, '["Emergency", "Oncology", "Cardiology"]', NOW()),
('hosp-005', 'KIMS Hospital', 17.6950, 83.2750, 'MVP Colony, Visakhapatnam', 160, 38, '+91-891-6789012', true, '["Emergency", "Gastroenterology", "Pulmonology"]', NOW()),
('hosp-006', 'Medicover Hospital', 17.7180, 83.3100, 'Maddilapalem, Visakhapatnam', 140, 42, '+91-891-7890123', true, '["Emergency", "Nephrology", "Urology"]', NOW()),
('hosp-007', 'Queen Hospital', 17.7020, 83.2880, 'Dwaraka Nagar, Visakhapatnam', 130, 35, '+91-891-8901234', true, '["Emergency", "Gynecology", "Obstetrics"]', NOW()),
('hosp-008', 'Lotus Hospital', 17.7350, 83.2950, 'Akkayyapalem, Visakhapatnam', 170, 48, '+91-891-9012345', true, '["Emergency", "Dermatology", "ENT"]', NOW()),
('hosp-009', 'Sri Ramachandra Hospital', 17.6780, 83.2350, 'Jagadamba Junction, Visakhapatnam', 190, 55, '+91-891-0123456', true, '["Emergency", "Ophthalmology", "Dental"]', NOW()),
('hosp-010', 'Visakha Hospital', 17.7540, 83.3180, 'Rushikonda, Visakhapatnam', 150, 40, '+91-891-1234567', true, '["Emergency", "General Medicine", "ICU"]', NOW()),
('hosp-011', 'Sai Hospital', 17.6880, 83.2650, 'Seethammadhara, Visakhapatnam', 125, 32, '+91-891-2345679', true, '["Emergency", "General Surgery", "Anesthesiology"]', NOW()),
('hosp-012', 'Shanti Hospital', 17.7250, 83.2780, 'Resapuvanipalem, Visakhapatnam', 135, 36, '+91-891-3456780', true, '["Emergency", "Radiology", "Pathology"]', NOW()),
('hosp-013', 'Narayana Hospital', 17.7080, 83.3150, 'Kommadi, Visakhapatnam', 165, 44, '+91-891-4567891', true, '["Emergency", "Physiotherapy", "Rehabilitation"]', NOW());

-- Sample Traffic Police Officers (first create users, then traffic_police records)
-- Note: Password is "password123" hashed with BCrypt
INSERT INTO users (id, username, password, role, full_name, phone, email, is_active, created_at)
VALUES
('user-traffic-001', 'officer1', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'TRAFFIC', 'Rajesh Kumar', '+91-9876543210', 'rajesh@traffic.gov.in', true, NOW()),
('user-traffic-002', 'officer2', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'TRAFFIC', 'Priya Sharma', '+91-9876543211', 'priya@traffic.gov.in', true, NOW()),
('user-traffic-003', 'officer3', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'TRAFFIC', 'Vikram Rao', '+91-9876543220', 'vikram@traffic.gov.in', true, NOW()),
('user-traffic-004', 'officer4', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'TRAFFIC', 'Lakshmi Devi', '+91-9876543221', 'lakshmi@traffic.gov.in', true, NOW()),
('user-traffic-005', 'officer5', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'TRAFFIC', 'Arjun Prasad', '+91-9876543222', 'arjun@traffic.gov.in', true, NOW()),
('user-traffic-006', 'officer6', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'TRAFFIC', 'Deepa Reddy', '+91-9876543223', 'deepa@traffic.gov.in', true, NOW()),
('user-traffic-007', 'officer7', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'TRAFFIC', 'Karthik Varma', '+91-9876543224', 'karthik@traffic.gov.in', true, NOW()),
('user-traffic-008', 'officer8', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'TRAFFIC', 'Anjali Krishna', '+91-9876543225', 'anjali@traffic.gov.in', true, NOW()),
('user-traffic-009', 'officer9', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'TRAFFIC', 'Sunil Babu', '+91-9876543226', 'sunil@traffic.gov.in', true, NOW()),
('user-traffic-010', 'officer10', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'TRAFFIC', 'Meera Kumari', '+91-9876543227', 'meera@traffic.gov.in', true, NOW()),
('user-traffic-011', 'officer11', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'TRAFFIC', 'Ramesh Naidu', '+91-9876543228', 'ramesh.n@traffic.gov.in', true, NOW()),
('user-traffic-012', 'officer12', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'TRAFFIC', 'Kavya Sastry', '+91-9876543229', 'kavya@traffic.gov.in', true, NOW()),
('user-ambulance-001', 'ambulance1', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Suresh Patil', '+91-9876543212', 'suresh@ems.com', true, NOW()),
('user-ambulance-002', 'ambulance2', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Anita Reddy', '+91-9876543213', 'anita@ems.com', true, NOW()),
('user-ambulance-003', 'ambulance3', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Ravi Kumar', '+91-9876543214', 'ravi@ems.com', true, NOW()),
('user-ambulance-004', 'ambulance4', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Sita Devi', '+91-9876543215', 'sita@ems.com', true, NOW()),
('user-ambulance-005', 'ambulance5', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Krishna Rao', '+91-9876543216', 'krishna@ems.com', true, NOW()),
('user-ambulance-006', 'ambulance6', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Padma Lakshmi', '+91-9876543217', 'padma@ems.com', true, NOW()),
('user-ambulance-007', 'ambulance7', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Venkat Naidu', '+91-9876543218', 'venkat@ems.com', true, NOW()),
('user-ambulance-008', 'ambulance8', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Lakshmi Priya', '+91-9876543219', 'lakshmipriya@ems.com', true, NOW()),
('user-ambulance-009', 'ambulance9', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Srinivas Reddy', '+91-9876543220', 'srinivas@ems.com', true, NOW()),
('user-ambulance-010', 'ambulance10', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Gayatri Singh', '+91-9876543221', 'gayatri@ems.com', true, NOW()),
('user-ambulance-011', 'ambulance11', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Murthy Prasad', '+91-9876543222', 'murthy@ems.com', true, NOW()),
('user-ambulance-012', 'ambulance12', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Devi Kumari', '+91-9876543223', 'devi@ems.com', true, NOW()),
('user-ambulance-013', 'ambulance13', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Rajendra Babu', '+91-9876543224', 'rajendra@ems.com', true, NOW()),
('user-ambulance-014', 'ambulance14', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Saritha Rani', '+91-9876543225', 'saritha@ems.com', true, NOW()),
('user-ambulance-015', 'ambulance15', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Mohan Varma', '+91-9876543226', 'mohan@ems.com', true, NOW()),
('user-ambulance-016', 'ambulance16', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Radha Krishna', '+91-9876543227', 'radha@ems.com', true, NOW()),
('user-ambulance-017', 'ambulance17', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Narayana Rao', '+91-9876543228', 'narayana@ems.com', true, NOW()),
('user-ambulance-018', 'ambulance18', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Swathi Reddy', '+91-9876543229', 'swathi@ems.com', true, NOW()),
('user-ambulance-019', 'ambulance19', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Prasad Naidu', '+91-9876543230', 'prasad@ems.com', true, NOW()),
('user-ambulance-020', 'ambulance20', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Anusha Devi', '+91-9876543231', 'anusha@ems.com', true, NOW()),
('user-ambulance-021', 'ambulance21', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Satish Kumar', '+91-9876543232', 'satish@ems.com', true, NOW()),
('user-ambulance-022', 'ambulance22', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'AMBULANCE', 'Heera Lal', '+91-9876543233', 'heera@ems.com', true, NOW()),
('user-hospital-001', 'hospital1', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Ramesh Kumar', '+91-9876543234', 'ramesh@citygen.com', true, NOW()),
('user-hospital-002', 'hospital2', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Priya Sharma', '+91-9876543235', 'priya@sevenhills.com', true, NOW()),
('user-hospital-003', 'hospital3', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Vijay Reddy', '+91-9876543236', 'vijay@care.com', true, NOW()),
('user-hospital-004', 'hospital4', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Anjali Rao', '+91-9876543237', 'anjali@apollo.com', true, NOW()),
('user-hospital-005', 'hospital5', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Suresh Naidu', '+91-9876543238', 'suresh@kims.com', true, NOW()),
('user-hospital-006', 'hospital6', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Lakshmi Devi', '+91-9876543239', 'lakshmi@medicover.com', true, NOW()),
('user-hospital-007', 'hospital7', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Karthik Varma', '+91-9876543240', 'karthik@queen.com', true, NOW()),
('user-hospital-008', 'hospital8', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Meera Krishna', '+91-9876543241', 'meera@lotus.com', true, NOW()),
('user-hospital-009', 'hospital9', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Ravi Prasad', '+91-9876543242', 'ravi@sriram.com', true, NOW()),
('user-hospital-010', 'hospital10', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Deepa Kumari', '+91-9876543243', 'deepa@visakha.com', true, NOW()),
('user-hospital-011', 'hospital11', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Arjun Sastry', '+91-9876543244', 'arjun@sai.com', true, NOW()),
('user-hospital-012', 'hospital12', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Kavya Reddy', '+91-9876543245', 'kavya@shanti.com', true, NOW()),
('user-hospital-013', 'hospital13', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'HOSPITAL', 'Dr. Mohan Babu', '+91-9876543246', 'mohan@narayana.com', true, NOW()),
('user-control-001', 'control', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'CONTROL', 'Control Room Admin', '+91-9876543215', 'admin@ero.gov.in', true, NOW());

INSERT INTO traffic_police (id, officer_user_id, badge_number, current_latitude, current_longitude, status, assigned_junctions, last_updated)
VALUES
('tp-001', 'user-traffic-001', 'TP-VSP-001', 17.6868, 83.2185, 'PATROLLING', '["Junction-RK-Beach", "Junction-Beach-Road"]', NOW()),
('tp-002', 'user-traffic-002', 'TP-VSP-002', 17.7306, 83.3076, 'PATROLLING', '["Junction-Madhurawada", "Junction-Rushikonda"]', NOW()),
('tp-003', 'user-traffic-003', 'TP-VSP-003', 17.7126, 83.2986, 'PATROLLING', '["Junction-Gajuwaka", "Junction-Kurmannapalem"]', NOW()),
('tp-004', 'user-traffic-004', 'TP-VSP-004', 17.7250, 83.3050, 'PATROLLING', '["Junction-NAD", "Junction-Maddilapalem"]', NOW()),
('tp-005', 'user-traffic-005', 'TP-VSP-005', 17.7070, 83.2980, 'PATROLLING', '["Junction-Dwaraka-Nagar", "Junction-Seethammadhara"]', NOW()),
('tp-006', 'user-traffic-006', 'TP-VSP-006', 17.7420, 83.3120, 'PATROLLING', '["Junction-PM-Palem", "Junction-Yendada"]', NOW()),
('tp-007', 'user-traffic-007', 'TP-VSP-007', 17.7210, 83.2950, 'PATROLLING', '["Junction-Resapuvanipalem", "Junction-Asilmetta"]', NOW()),
('tp-008', 'user-traffic-008', 'TP-VSP-008', 17.6920, 83.2580, 'PATROLLING', '["Junction-Scindia", "Junction-Waltair"]', NOW()),
('tp-009', 'user-traffic-009', 'TP-VSP-009', 17.7050, 83.2850, 'PATROLLING', '["Junction-Nathayyapalem", "Junction-Old-Gajuwaka"]', NOW()),
('tp-010', 'user-traffic-010', 'TP-VSP-010', 17.7380, 83.2620, 'PATROLLING', '["Junction-Gopalapatnam", "Junction-Pedagantyada"]', NOW()),
('tp-011', 'user-traffic-011', 'TP-VSP-011', 17.7150, 83.3200, 'PATROLLING', '["Junction-Kommadi", "Junction-Anandapuram"]', NOW()),
('tp-012', 'user-traffic-012', 'TP-VSP-012', 17.6780, 83.2100, 'PATROLLING', '["Junction-Vizag-Port", "Junction-NAD-Kotha-Road"]', NOW());

-- Sample Ambulances
INSERT INTO ambulances (id, vehicle_number, operator_user_id, current_latitude, current_longitude, status, equipment, last_updated)
VALUES
('amb-001', 'AP-31-EMR-1001', 'user-ambulance-001', 17.6868, 83.2185, 'AVAILABLE', '["defibrillator", "oxygen", "trauma_kit", "stretcher"]', NOW()),
('amb-002', 'AP-31-EMR-1002', 'user-ambulance-002', 17.7306, 83.3076, 'AVAILABLE', '["defibrillator", "oxygen", "first_aid", "ventilator"]', NOW()),
('amb-003', 'AP-31-EMR-1003', 'user-ambulance-003', 17.7125, 83.2980, 'AVAILABLE', '["defibrillator", "oxygen", "trauma_kit", "stretcher"]', NOW()),
('amb-004', 'AP-31-EMR-1004', 'user-ambulance-004', 17.6950, 83.2150, 'AVAILABLE', '["defibrillator", "oxygen", "first_aid", "ventilator"]', NOW()),
('amb-005', 'AP-31-EMR-1005', 'user-ambulance-005', 17.7540, 83.3250, 'AVAILABLE', '["defibrillator", "oxygen", "trauma_kit", "stretcher"]', NOW()),
('amb-006', 'AP-31-EMR-1006', 'user-ambulance-006', 17.7180, 83.2850, 'AVAILABLE', '["defibrillator", "oxygen", "first_aid", "ventilator"]', NOW()),
('amb-007', 'AP-31-EMR-1007', 'user-ambulance-007', 17.7250, 83.3150, 'AVAILABLE', '["defibrillator", "oxygen", "trauma_kit", "stretcher"]', NOW()),
('amb-008', 'AP-31-EMR-1008', 'user-ambulance-008', 17.7100, 83.2500, 'AVAILABLE', '["defibrillator", "oxygen", "first_aid", "ventilator"]', NOW()),
('amb-009', 'AP-31-EMR-1009', 'user-ambulance-009', 17.7420, 83.3100, 'AVAILABLE', '["defibrillator", "oxygen", "trauma_kit", "stretcher"]', NOW()),
('amb-010', 'AP-31-EMR-1010', 'user-ambulance-010', 17.7380, 83.2950, 'AVAILABLE', '["defibrillator", "oxygen", "first_aid", "ventilator"]', NOW()),
('amb-011', 'AP-31-EMR-1011', 'user-ambulance-011', 17.7320, 83.2700, 'AVAILABLE', '["defibrillator", "oxygen", "trauma_kit", "stretcher"]', NOW()),
('amb-012', 'AP-31-EMR-1012', 'user-ambulance-012', 17.7285, 83.2620, 'AVAILABLE', '["defibrillator", "oxygen", "first_aid", "ventilator"]', NOW()),
('amb-013', 'AP-31-EMR-1013', 'user-ambulance-013', 17.7050, 83.2300, 'AVAILABLE', '["defibrillator", "oxygen", "trauma_kit", "stretcher"]', NOW()),
('amb-014', 'AP-31-EMR-1014', 'user-ambulance-014', 17.6780, 83.2100, 'AVAILABLE', '["defibrillator", "oxygen", "first_aid", "ventilator"]', NOW()),
('amb-015', 'AP-31-EMR-1015', 'user-ambulance-015', 17.7200, 83.2900, 'AVAILABLE', '["defibrillator", "oxygen", "trauma_kit", "stretcher"]', NOW()),
('amb-016', 'AP-31-EMR-1016', 'user-ambulance-016', 17.7450, 83.3180, 'AVAILABLE', '["defibrillator", "oxygen", "first_aid", "ventilator"]', NOW()),
('amb-017', 'AP-31-EMR-1017', 'user-ambulance-017', 17.6900, 83.2200, 'AVAILABLE', '["defibrillator", "oxygen", "trauma_kit", "stretcher"]', NOW()),
('amb-018', 'AP-31-EMR-1018', 'user-ambulance-018', 17.7150, 83.2800, 'AVAILABLE', '["defibrillator", "oxygen", "first_aid", "ventilator"]', NOW()),
('amb-019', 'AP-31-EMR-1019', 'user-ambulance-019', 17.7280, 83.3050, 'AVAILABLE', '["defibrillator", "oxygen", "trauma_kit", "stretcher"]', NOW()),
('amb-020', 'AP-31-EMR-1020', 'user-ambulance-020', 17.7350, 83.2750, 'AVAILABLE', '["defibrillator", "oxygen", "first_aid", "ventilator"]', NOW()),
('amb-021', 'AP-31-EMR-1021', 'user-ambulance-021', 17.6850, 83.2250, 'AVAILABLE', '["defibrillator", "oxygen", "trauma_kit", "stretcher"]', NOW()),
('amb-022', 'AP-31-EMR-1022', 'user-ambulance-022', 17.7400, 83.3200, 'AVAILABLE', '["defibrillator", "oxygen", "first_aid", "ventilator"]', NOW());

-- Update hospital admin user IDs
UPDATE hospitals SET admin_user_id = 'user-hospital-001' WHERE id = 'hosp-001';
UPDATE hospitals SET admin_user_id = 'user-hospital-002' WHERE id = 'hosp-002';
UPDATE hospitals SET admin_user_id = 'user-hospital-003' WHERE id = 'hosp-003';
UPDATE hospitals SET admin_user_id = 'user-hospital-004' WHERE id = 'hosp-004';
UPDATE hospitals SET admin_user_id = 'user-hospital-005' WHERE id = 'hosp-005';
UPDATE hospitals SET admin_user_id = 'user-hospital-006' WHERE id = 'hosp-006';
UPDATE hospitals SET admin_user_id = 'user-hospital-007' WHERE id = 'hosp-007';
UPDATE hospitals SET admin_user_id = 'user-hospital-008' WHERE id = 'hosp-008';
UPDATE hospitals SET admin_user_id = 'user-hospital-009' WHERE id = 'hosp-009';
UPDATE hospitals SET admin_user_id = 'user-hospital-010' WHERE id = 'hosp-010';
UPDATE hospitals SET admin_user_id = 'user-hospital-011' WHERE id = 'hosp-011';
UPDATE hospitals SET admin_user_id = 'user-hospital-012' WHERE id = 'hosp-012';
UPDATE hospitals SET admin_user_id = 'user-hospital-013' WHERE id = 'hosp-013';

-- Sample Citizen (guest access, no password needed)
INSERT INTO users (id, username, password, role, full_name, phone, email, is_active, created_at)
VALUES
('user-citizen-001', 'guest', '$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS', 'CITIZEN', 'Guest User', '', '', true, NOW());

-- Display Summary
SELECT 'Data seeding completed successfully!' AS Status;
SELECT COUNT(*) AS 'Total Hospitals' FROM hospitals;
SELECT COUNT(*) AS 'Total Ambulances' FROM ambulances;
SELECT COUNT(*) AS 'Total Traffic Officers' FROM traffic_police;
SELECT COUNT(*) AS 'Total Users' FROM users;

-- Test Credentials (all passwords: password123)
-- Username: officer1 (Traffic Police)
-- Username: ambulance1 (Ambulance Operator)
-- Username: hospital1 (Hospital Admin)
-- Username: control (Control Room)
-- Username: guest (Citizen - for testing, citizens don't need login in frontend)
