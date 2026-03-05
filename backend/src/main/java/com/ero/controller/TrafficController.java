package com.ero.controller;

import com.ero.dto.LocationUpdate;
import com.ero.model.TrafficPolice;
import com.ero.model.TrafficAssignment;
import com.ero.service.TrafficService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/traffic")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class TrafficController {

    private final TrafficService trafficService;

    @GetMapping("/all")
    public ResponseEntity<List<TrafficPolice>> getAllTrafficPolice() {
        return ResponseEntity.ok(trafficService.getAllTrafficPolice());
    }

    @GetMapping("/available")
    public ResponseEntity<List<TrafficPolice>> getAvailableOfficers() {
        return ResponseEntity.ok(trafficService.getAvailableOfficers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTrafficPoliceById(@PathVariable String id) {
        try {
            TrafficPolice officer = trafficService.getTrafficPoliceById(id);
            return ResponseEntity.ok(officer);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/officer/{userId}")
    public ResponseEntity<?> getTrafficPoliceByOfficerUserId(@PathVariable String userId) {
        try {
            TrafficPolice officer = trafficService.getTrafficPoliceByOfficerUserId(userId);
            return ResponseEntity.ok(officer);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/location")
    public ResponseEntity<?> updateLocation(@PathVariable String id, @RequestBody LocationUpdate location) {
        try {
            TrafficPolice officer = trafficService.updateLocation(id, location.getLatitude(), location.getLongitude());
            return ResponseEntity.ok(officer);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            TrafficPolice.Status status = TrafficPolice.Status.valueOf(request.get("status"));
            TrafficPolice officer = trafficService.updateStatus(id, status);
            return ResponseEntity.ok(officer);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/assignment/create")
    public ResponseEntity<?> createAssignment(@RequestBody Map<String, String> request) {
        try {
            TrafficAssignment assignment = trafficService.createAssignment(
                    request.get("emergencyId"),
                    request.get("officerId"),
                    request.get("junctionId"),
                    request.get("junctionName")
            );
            return ResponseEntity.ok(assignment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/assignment/{id}/acknowledge")
    public ResponseEntity<?> acknowledgeAssignment(@PathVariable String id) {
        try {
            TrafficAssignment assignment = trafficService.acknowledgeAssignment(id);
            return ResponseEntity.ok(assignment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/assignment/{id}/start")
    public ResponseEntity<?> startClearing(@PathVariable String id) {
        try {
            TrafficAssignment assignment = trafficService.startClearing(id);
            return ResponseEntity.ok(assignment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/assignment/{id}/complete")
    public ResponseEntity<?> completeAssignment(@PathVariable String id) {
        try {
            TrafficAssignment assignment = trafficService.completeAssignment(id);
            return ResponseEntity.ok(assignment);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/assignment/emergency/{emergencyId}")
    public ResponseEntity<List<TrafficAssignment>> getAssignmentsByEmergencyId(@PathVariable String emergencyId) {
        return ResponseEntity.ok(trafficService.getAssignmentsByEmergencyId(emergencyId));
    }

    @GetMapping("/assignment/officer/{officerId}")
    public ResponseEntity<List<TrafficAssignment>> getAssignmentsByOfficerId(@PathVariable String officerId) {
        return ResponseEntity.ok(trafficService.getAssignmentsByOfficerId(officerId));
    }
}
