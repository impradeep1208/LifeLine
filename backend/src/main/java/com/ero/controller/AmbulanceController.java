package com.ero.controller;

import com.ero.dto.LocationUpdate;
import com.ero.model.Ambulance;
import com.ero.service.AmbulanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ambulance")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AmbulanceController {

    private final AmbulanceService ambulanceService;

    @GetMapping("/all")
    public ResponseEntity<List<Ambulance>> getAllAmbulances() {
        return ResponseEntity.ok(ambulanceService.getAllAmbulances());
    }

    @GetMapping("/available")
    public ResponseEntity<List<Ambulance>> getAvailableAmbulances() {
        return ResponseEntity.ok(ambulanceService.getAvailableAmbulances());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAmbulanceById(@PathVariable String id) {
        try {
            Ambulance ambulance = ambulanceService.getAmbulanceById(id);
            return ResponseEntity.ok(ambulance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/operator/{userId}")
    public ResponseEntity<?> getAmbulanceByOperatorUserId(@PathVariable String userId) {
        try {
            Ambulance ambulance = ambulanceService.getAmbulanceByOperatorUserId(userId);
            return ResponseEntity.ok(ambulance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/nearest")
    public ResponseEntity<List<Ambulance>> findNearestAmbulances(
            @RequestParam Double latitude,
            @RequestParam Double longitude,
            @RequestParam(defaultValue = "50.0") Double radius) {
        return ResponseEntity.ok(ambulanceService.findNearestAmbulances(latitude, longitude, radius));
    }

    @PutMapping("/{id}/location")
    public ResponseEntity<?> updateLocation(@PathVariable String id, @RequestBody LocationUpdate location) {
        try {
            Ambulance ambulance = ambulanceService.updateLocation(id, location.getLatitude(), location.getLongitude());
            return ResponseEntity.ok(ambulance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            Ambulance.Status status = Ambulance.Status.valueOf(request.get("status"));
            Ambulance ambulance = ambulanceService.updateStatus(id, status);
            return ResponseEntity.ok(ambulance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/create")
    public ResponseEntity<?> createAmbulance(@RequestBody Map<String, String> request) {
        try {
            Ambulance ambulance = ambulanceService.createAmbulance(
                    request.get("vehicleNumber"),
                    request.get("operatorUserId"),
                    request.get("equipment")
            );
            return ResponseEntity.ok(ambulance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAmbulance(@PathVariable String id) {
        try {
            ambulanceService.deleteAmbulance(id);
            return ResponseEntity.ok(Map.of("message", "Ambulance deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/availability")
    public ResponseEntity<?> setAvailability(@PathVariable String id, @RequestBody Map<String, Boolean> request) {
        try {
            Boolean isAvailable = request.get("isAvailable");
            Ambulance ambulance = ambulanceService.setAvailability(id, isAvailable);
            return ResponseEntity.ok(ambulance);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
