package com.ero.controller;

import com.ero.service.EmergencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminController {

    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final EmergencyService emergencyService;

    @PostMapping("/seed-data")
    public ResponseEntity<?> seedDatabase() {
        try {
            Map<String, Object> result = new HashMap<>();
            
            // Seed Hospitals
            jdbcTemplate.execute(
                "INSERT INTO hospitals (id, name, latitude, longitude, address, total_beds, available_beds, contact_phone, is_active, specializations, last_updated) " +
                "VALUES " +
                "('hosp-001', 'City General Hospital', 17.7200, 83.2950, 'Beach Road, Visakhapatnam', 200, 45, '+91-891-2345678', true, " +
                "CAST('[\"Emergency\", \"Cardiology\", \"Trauma\"]' AS jsonb), CURRENT_TIMESTAMP), " +
                "('hosp-002', 'Seven Hills Hospital', 17.7306, 83.3076, 'Madhurawada, Visakhapatnam', 150, 30, '+91-891-3456789', true, " +
                "CAST('[\"Emergency\", \"Neurology\"]' AS jsonb), CURRENT_TIMESTAMP), " +
                "('hosp-003', 'Care Hospital', 17.7126, 83.2986, 'Gajuwaka, Visakhapatnam', 180, 52, '+91-891-4567890', true, " +
                "CAST('[\"Emergency\", \"Surgery\"]' AS jsonb), CURRENT_TIMESTAMP), " +
                "('hosp-004', 'Apollo Hospital', 17.7450, 83.3250, 'Arilova, Visakhapatnam', 220, 60, '+91-891-5678901', true, " +
                "CAST('[\"Emergency\", \"Cardiology\"]' AS jsonb), CURRENT_TIMESTAMP), " +
                "('hosp-005', 'KIMS Hospital', 17.6950, 83.2750, 'MVP Colony, Visakhapatnam', 160, 38, '+91-891-6789012', true, " +
                "CAST('[\"Emergency\", \"Gastroenterology\"]' AS jsonb), CURRENT_TIMESTAMP) " +
                "ON CONFLICT (id) DO NOTHING"
            );
            
            // Get BCrypt password hash for "password123"
            String passwordHash = "$2a$10$/rpORbek7gEeyRj0ptpYbeDKayjnEdzoKl3ndQ/308qE81xP1OEYS";
            
            // Seed Users
            jdbcTemplate.execute(
                "INSERT INTO users (id, username, password, role, full_name, phone, email, is_active, created_at) " +
                "VALUES " +
                "('demo-traffic-001', 'officer1', '" + passwordHash + "', 'TRAFFIC', 'Officer Rajesh', '+91-9876543210', 'rajesh@traffic.gov', true, CURRENT_TIMESTAMP), " +
                "('demo-traffic-002', 'officer2', '" + passwordHash + "', 'TRAFFIC', 'Officer Priya', '+91-9876543211', 'priya@traffic.gov', true, CURRENT_TIMESTAMP), " +
                "('demo-ambulance-001', 'driver1', '" + passwordHash + "', 'AMBULANCE', 'Driver Suresh', '+91-9876543212', 'suresh@ems.com', true, CURRENT_TIMESTAMP), " +
                "('demo-ambulance-002', 'driver2', '" + passwordHash + "', 'AMBULANCE', 'Driver Anita', '+91-9876543213', 'anita@ems.com', true, CURRENT_TIMESTAMP), " +
                "('demo-ambulance-003', 'driver3', '" + passwordHash + "', 'AMBULANCE', 'Driver Ravi', '+91-9876543214', 'ravi@ems.com', true, CURRENT_TIMESTAMP), " +
                "('demo-hospital-001', 'hospital1', '" + passwordHash + "', 'HOSPITAL', 'Dr. Ramesh', '+91-9876543215', 'ramesh@citygen.com', true, CURRENT_TIMESTAMP), " +
                "('demo-hospital-002', 'hospital2', '" + passwordHash + "', 'HOSPITAL', 'Dr. Priya', '+91-9876543216', 'priya@sevenhills.com', true, CURRENT_TIMESTAMP), " +
                "('demo-hospital-003', 'carehospital', '" + passwordHash + "', 'HOSPITAL', 'Dr. Kumar', '+91-9876543220', 'kumar@care.com', true, CURRENT_TIMESTAMP), " +
                "('demo-hospital-004', 'apollohospital', '" + passwordHash + "', 'HOSPITAL', 'Dr. Reddy', '+91-9876543221', 'reddy@apollo.com', true, CURRENT_TIMESTAMP), " +
                "('demo-hospital-005', 'kimshospital', '" + passwordHash + "', 'HOSPITAL', 'Dr. Sharma', '+91-9876543222', 'sharma@kims.com', true, CURRENT_TIMESTAMP), " +
                "('demo-control-001', 'admin', '" + passwordHash + "', 'CONTROL', 'Control Admin', '+91-9876543217', 'admin@ero.gov', true, CURRENT_TIMESTAMP) " +
                "ON CONFLICT (username) DO NOTHING"
            );
            
            // Seed Traffic Police
            jdbcTemplate.execute(
                "INSERT INTO traffic_police (id, officer_user_id, badge_number, current_latitude, current_longitude, status, assigned_junctions, last_updated) " +
                "VALUES " +
                "('tp-demo-001', 'demo-traffic-001', 'TP-VSP-001', 17.6868, 83.2185, 'PATROLLING', " +
                "CAST('[\"Beach Road\", \"RK Beach\"]' AS jsonb), CURRENT_TIMESTAMP), " +
                "('tp-demo-002', 'demo-traffic-002', 'TP-VSP-002', 17.7306, 83.3076, 'PATROLLING', " +
                "CAST('[\"Madhurawada\", \"Rushikonda\"]' AS jsonb), CURRENT_TIMESTAMP) " +
                "ON CONFLICT (id) DO NOTHING"
            );
            
            // Seed Ambulances
            jdbcTemplate.execute(
                "INSERT INTO ambulances (id, vehicle_number, operator_user_id, current_latitude, current_longitude, status, equipment, last_updated) " +
                "VALUES " +
                "('amb-demo-001', 'AP-31-EMR-1001', 'demo-ambulance-001', 17.6868, 83.2185, 'AVAILABLE', " +
                "CAST('[\"defibrillator\", \"oxygen\", \"trauma_kit\"]' AS jsonb), CURRENT_TIMESTAMP), " +
                "('amb-demo-002', 'AP-31-EMR-1002', 'demo-ambulance-002', 17.7306, 83.3076, 'AVAILABLE', " +
                "CAST('[\"defibrillator\", \"oxygen\", \"ventilator\"]' AS jsonb), CURRENT_TIMESTAMP), " +
                "('amb-demo-003', 'AP-31-EMR-1003', 'demo-ambulance-003', 17.7126, 83.2986, 'AVAILABLE', " +
                "CAST('[\"defibrillator\", \"oxygen\", \"stretcher\"]' AS jsonb), CURRENT_TIMESTAMP) " +
                "ON CONFLICT (id) DO NOTHING"
            );
            
            // Link hospitals to admins
            jdbcTemplate.execute(
                "UPDATE hospitals SET admin_user_id = 'demo-hospital-001' WHERE id = 'hosp-001'"
            );
            jdbcTemplate.execute(
                "UPDATE hospitals SET admin_user_id = 'demo-hospital-002' WHERE id = 'hosp-002'"
            );
            jdbcTemplate.execute(
                "UPDATE hospitals SET admin_user_id = 'demo-hospital-003' WHERE id = 'hosp-003'"
            );
            jdbcTemplate.execute(
                "UPDATE hospitals SET admin_user_id = 'demo-hospital-004' WHERE id = 'hosp-004'"
            );
            jdbcTemplate.execute(
                "UPDATE hospitals SET admin_user_id = 'demo-hospital-005' WHERE id = 'hosp-005'"
            );
            
            // Get counts
            Integer hospitalCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM hospitals", Integer.class);
            Integer ambulanceCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ambulances", Integer.class);
            Integer trafficCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM traffic_police", Integer.class);
            Integer userCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
            
            result.put("success", true);
            result.put("message", "Seed data inserted successfully!");
            result.put("hospitals", hospitalCount);
            result.put("ambulances", ambulanceCount);
            result.put("trafficPolice", trafficCount);
            result.put("users", userCount);
            result.put("testCredentials", Map.of(
                "username", "driver1, driver2, driver3, officer1, officer2, hospital1, hospital2, carehospital, apollohospital, kimshospital, admin",
                "password", "password123",
                "note", "Login with any of these usernames and select the matching role"
            ));
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @GetMapping("/seed-data")
    public ResponseEntity<?> seedDatabaseGet() {
        return seedDatabase();
    }
    
    @PostMapping("/fix-emergencies")
    public ResponseEntity<?> fixUnassignedEmergencies() {
        try {
            // Find emergencies with CREATED status (unassigned)
            var unassignedEmergencies = jdbcTemplate.queryForList(
                "SELECT id, emergency_code, latitude, longitude FROM emergencies WHERE status = 'CREATED' AND assigned_ambulance_id IS NULL"
            );
            
            // Find available ambulances
            var availableAmbulances = jdbcTemplate.queryForList(
                "SELECT id, vehicle_number FROM ambulances WHERE status = 'AVAILABLE' ORDER BY id"
            );
            
            int fixed = 0;
            for (var emergency : unassignedEmergencies) {
                if (!availableAmbulances.isEmpty()) {
                    String emergencyId = (String) emergency.get("id");
                    String ambulanceId = (String) availableAmbulances.get(0).get("id");
                    
                    // Assign ambulance using service method
                    emergencyService.assignAmbulance(emergencyId, ambulanceId);
                    
                    // Assign hospital
                    emergencyService.assignHospital(emergencyId);
                    
                    fixed++;
                    availableAmbulances.remove(0); // Use next ambulance for next emergency
                }
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("fixedEmergencies", fixed);
            result.put("message", "Fixed " + fixed + " unassigned emergencies");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @GetMapping("/fix-emergencies")
    public ResponseEntity<?> fixUnassignedEmergenciesGet() {
        return fixUnassignedEmergencies();
    }
    
    @PostMapping("/cleanup-old-emergencies")
    public ResponseEntity<?> cleanupOldEmergencies() {
        try {
            // Mark all DELIVERED emergencies as COMPLETED
            int deliveredCleaned = jdbcTemplate.update(
                "UPDATE emergencies SET status = 'COMPLETED' WHERE status = 'DELIVERED'"
            );
            
            // Mark emergencies older than 2 hours as COMPLETED if still active
            // This is more aggressive for testing and prevents old emergencies from lingering
            int oldCleaned = jdbcTemplate.update(
                "UPDATE emergencies SET status = 'COMPLETED' " +
                "WHERE status IN ('CREATED', 'DISPATCHED', 'EN_ROUTE', 'ARRIVED', 'PATIENT_LOADED', 'TRANSPORTING') " +
                "AND created_at < NOW() - INTERVAL '2 hours'"
            );
            
            // Reset ambulances that reference COMPLETED emergencies
            int ambulancesReset = jdbcTemplate.update(
                "UPDATE ambulances SET status = 'AVAILABLE', current_emergency_id = NULL, is_available = true " +
                "WHERE current_emergency_id IN (SELECT id FROM emergencies WHERE status = 'COMPLETED')"
            );
            
            // Clear hospital bed assignments for COMPLETED emergencies
            int bedsCleared = jdbcTemplate.update(
                "UPDATE emergencies SET assigned_bed_number = NULL WHERE status = 'COMPLETED' AND assigned_bed_number IS NOT NULL"
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("deliveredToCompleted", deliveredCleaned);
            result.put("oldEmergenciesCleaned", oldCleaned);
            result.put("totalCleaned", deliveredCleaned + oldCleaned);
            result.put("ambulancesReset", ambulancesReset);
            result.put("bedsCleared", bedsCleared);
            result.put("message", "Cleaned up " + (deliveredCleaned + oldCleaned) + " old emergencies and reset " + ambulancesReset + " ambulances");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @GetMapping("/cleanup-old-emergencies")
    public ResponseEntity<?> cleanupOldEmergenciesGet() {
        return cleanupOldEmergencies();
    }
    
    @PostMapping("/reset-ambulances")
    public ResponseEntity<?> resetAmbulances() {
        try {
            // Reset all ambulances to AVAILABLE status and clear currentEmergencyId
            int updated = jdbcTemplate.update(
                "UPDATE ambulances SET status = 'AVAILABLE', current_emergency_id = NULL, is_available = true"
            );
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("ambulancesReset", updated);
            result.put("message", "Reset " + updated + " ambulances to AVAILABLE status");
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
    
    @GetMapping("/reset-ambulances")
    public ResponseEntity<?> resetAmbulancesGet() {
        return resetAmbulances();
    }
}
