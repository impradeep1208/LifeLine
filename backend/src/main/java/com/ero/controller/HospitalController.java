package com.ero.controller;

import com.ero.model.Hospital;
import com.ero.service.HospitalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hospital")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class HospitalController {

    private final HospitalService hospitalService;

    @GetMapping("/all")
    public ResponseEntity<List<Hospital>> getAllHospitals() {
        return ResponseEntity.ok(hospitalService.getAllHospitals());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Hospital>> getActiveHospitals() {
        return ResponseEntity.ok(hospitalService.getActiveHospitals());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getHospitalById(@PathVariable String id) {
        try {
            Hospital hospital = hospitalService.getHospitalById(id);
            return ResponseEntity.ok(hospital);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/admin/{userId}")
    public ResponseEntity<?> getHospitalByAdminUserId(@PathVariable String userId) {
        try {
            Hospital hospital = hospitalService.getHospitalByAdminUserId(userId);
            return ResponseEntity.ok(hospital);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/nearest")
    public ResponseEntity<List<Hospital>> findNearestHospitalsWithBeds(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "50.0") Double radius) {
        return ResponseEntity.ok(hospitalService.findNearestHospitalsWithBeds(latitude, longitude, radius));
    }

    @PutMapping("/{id}/beds")
    public ResponseEntity<?> updateAvailableBeds(@PathVariable String id, @RequestBody Map<String, Integer> request) {
        try {
            Hospital hospital = hospitalService.updateAvailableBeds(id, request.get("availableBeds"));
            return ResponseEntity.ok(hospital);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/create")
    public ResponseEntity<?> createHospital(@RequestBody Hospital hospital) {
        try {
            Hospital created = hospitalService.createHospital(
                    hospital.getName(),
                    hospital.getLatitude(),
                    hospital.getLongitude(),
                    hospital.getAddress(),
                    hospital.getTotalBeds(),
                    hospital.getAdminUserId()
            );
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateHospital(@PathVariable String id, @RequestBody Hospital hospital) {
        try {
            Hospital updated = hospitalService.updateHospital(id, hospital);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHospital(@PathVariable String id) {
        try {
            hospitalService.deleteHospital(id);
            return ResponseEntity.ok(Map.of("message", "Hospital deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/stats/beds")
    public ResponseEntity<?> getTotalAvailableBeds() {
        Long totalBeds = hospitalService.getTotalAvailableBeds();
        return ResponseEntity.ok(Map.of("totalAvailableBeds", totalBeds != null ? totalBeds : 0));
    }
}
