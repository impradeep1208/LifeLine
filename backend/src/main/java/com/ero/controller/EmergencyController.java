package com.ero.controller;

import com.ero.dto.CreateEmergencyRequest;
import com.ero.model.Emergency;
import com.ero.service.EmergencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emergency")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class EmergencyController {

    private final EmergencyService emergencyService;

    @PostMapping("/create")
    public ResponseEntity<?> createEmergency(@RequestBody CreateEmergencyRequest request) {
        try {
            Emergency emergency = emergencyService.createEmergency(
                    request.getCitizenId(),
                    request.getLatitude(),
                    request.getLongitude(),
                    request.getAddress(),
                    request.getSeverity(),
                    request.getAdditionalInfo()
            );
            return ResponseEntity.ok(emergency);
        } catch (RuntimeException e) {
            if ("DUPLICATE_SOS_DETECTED".equals(e.getMessage())) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "DUPLICATE_SOS",
                    "message", "Emergency already reported nearby. Help is on the way!"
                ));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<Emergency>> getAllEmergencies() {
        return ResponseEntity.ok(emergencyService.getAllEmergencies());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Emergency>> getActiveEmergencies() {
        return ResponseEntity.ok(emergencyService.getActiveEmergencies());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getEmergencyById(@PathVariable String id) {
        try {
            Emergency emergency = emergencyService.getEmergencyById(id);
            return ResponseEntity.ok(emergency);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<?> getEmergencyByCode(@PathVariable String code) {
        try {
            Emergency emergency = emergencyService.getEmergencyByCode(code);
            return ResponseEntity.ok(emergency);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/assign-ambulance/{ambulanceId}")
    public ResponseEntity<?> assignAmbulance(@PathVariable String id, @PathVariable String ambulanceId) {
        try {
            Emergency emergency = emergencyService.assignAmbulance(id, ambulanceId);
            return ResponseEntity.ok(emergency);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/assign-hospital")
    public ResponseEntity<?> assignHospital(@PathVariable String id) {
        try {
            Emergency emergency = emergencyService.assignHospital(id);
            return ResponseEntity.ok(emergency);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            Emergency.Status status = Emergency.Status.valueOf(request.get("status"));
            Emergency emergency = emergencyService.updateStatus(id, status);
            return ResponseEntity.ok(emergency);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/ambulance/{ambulanceId}")
    public ResponseEntity<List<Emergency>> getEmergenciesByAmbulance(@PathVariable String ambulanceId) {
        return ResponseEntity.ok(emergencyService.getEmergenciesByAmbulance(ambulanceId));
    }
    
    @GetMapping("/hospital/{hospitalId}")
    public ResponseEntity<List<Emergency>> getEmergenciesByHospital(@PathVariable String hospitalId) {
        return ResponseEntity.ok(emergencyService.getEmergenciesByHospital(hospitalId));
    }

    @PostMapping("/{id}/assign-bed")
    public ResponseEntity<?> assignBedNumber(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            String bedNumber = request.get("bedNumber");
            Emergency emergency = emergencyService.assignBedNumber(id, bedNumber);
            return ResponseEntity.ok(emergency);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
