package com.ero.service;

import com.ero.model.User;
import com.ero.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PointsService {

    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private static final int POINTS_PER_EMERGENCY = 25;

    @Transactional
    public void awardPoints(String userId, int points, String reason, String emergencyId) {
        userRepository.findById(userId).ifPresent(user -> {
            int currentPoints = user.getPoints() != null ? user.getPoints() : 0;
            user.setPoints(currentPoints + points);
            userRepository.save(user);
            
            log.info("Awarded {} points to user {} for {}", points, userId, reason);
            
            // Send notification
            notificationService.createNotification(
                    userId,
                    "🎉 Points Awarded!",
                    String.format("You earned %d points! Reason: %s. Total points: %d", 
                            points, reason, user.getPoints()),
                    com.ero.model.Notification.NotificationType.POINTS_AWARDED,
                    emergencyId
            );
        });
    }

    @Transactional
    public void awardPointsForEmergencyCompletion(String citizenId, String ambulanceOperatorId, 
                                                  List<String> trafficOfficerIds, String emergencyId) {
        // Award points to citizen
        awardPoints(citizenId, POINTS_PER_EMERGENCY, "Emergency SOS assistance", emergencyId);
        
        // Award points to ambulance driver
        awardPoints(ambulanceOperatorId, POINTS_PER_EMERGENCY, "Emergency response completed", emergencyId);
        
        // Award points to traffic officers
        if (trafficOfficerIds != null) {
            trafficOfficerIds.forEach(officerId -> 
                    awardPoints(officerId, POINTS_PER_EMERGENCY, "Traffic clearance assistance", emergencyId));
        }
        
        log.info("Awarded points for emergency completion: {}", emergencyId);
    }

    public List<User> getLeaderboard(String region, User.UserRole role) {
        if (region != null && !region.isEmpty()) {
            return userRepository.findByRegionAndRoleOrderByPointsDesc(region, role)
                    .stream()
                    .limit(10)
                    .collect(Collectors.toList());
        } else {
            return userRepository.findByRoleOrderByPointsDesc(role)
                    .stream()
                    .limit(10)
                    .collect(Collectors.toList());
        }
    }

    public int getUserPoints(String userId) {
        return userRepository.findById(userId)
                .map(user -> user.getPoints() != null ? user.getPoints() : 0)
                .orElse(0);
    }
}
