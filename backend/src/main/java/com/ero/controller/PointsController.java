package com.ero.controller;

import com.ero.model.User;
import com.ero.service.PointsService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/points")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class PointsController {

    private final PointsService pointsService;

    @GetMapping("/user/{userId}")
    public ResponseEntity<Map<String, Integer>> getUserPoints(@PathVariable String userId) {
        int points = pointsService.getUserPoints(userId);
        return ResponseEntity.ok(Map.of("points", points));
    }

    @GetMapping("/leaderboard/{role}")
    public ResponseEntity<List<User>> getLeaderboard(
            @PathVariable String role,
            @RequestParam(required = false) String region) {
        User.UserRole userRole = User.UserRole.valueOf(role.toUpperCase());
        List<User> leaderboard = pointsService.getLeaderboard(region, userRole);
        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping("/leaderboard")
    public ResponseEntity<List<User>> getGlobalLeaderboard(
            @RequestParam(required = false, defaultValue = "CITIZEN") String role) {
        User.UserRole userRole = User.UserRole.valueOf(role.toUpperCase());
        List<User> leaderboard = pointsService.getLeaderboard(null, userRole);
        return ResponseEntity.ok(leaderboard);
    }
}
