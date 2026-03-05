package com.ero.controller;

import com.ero.model.EmergencyHistory;
import com.ero.service.EmergencyHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HistoryController {

    private final EmergencyHistoryService emergencyHistoryService;

    @GetMapping("/citizen/{citizenId}")
    public ResponseEntity<List<EmergencyHistory>> getCitizenHistory(@PathVariable String citizenId) {
        return ResponseEntity.ok(emergencyHistoryService.getHistoryByCitizen(citizenId));
    }

    @GetMapping("/ambulance/{ambulanceId}")
    public ResponseEntity<List<EmergencyHistory>> getAmbulanceHistory(@PathVariable String ambulanceId) {
        return ResponseEntity.ok(emergencyHistoryService.getHistoryByAmbulance(ambulanceId));
    }

    @GetMapping("/hospital/{hospitalId}")
    public ResponseEntity<List<EmergencyHistory>> getHospitalHistory(@PathVariable String hospitalId) {
        return ResponseEntity.ok(emergencyHistoryService.getHistoryByHospital(hospitalId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<EmergencyHistory>> getAllHistory() {
        return ResponseEntity.ok(emergencyHistoryService.getAllHistory());
    }
}
