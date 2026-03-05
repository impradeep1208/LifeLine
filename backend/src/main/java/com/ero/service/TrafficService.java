package com.ero.service;

import com.ero.model.TrafficPolice;
import com.ero.model.TrafficAssignment;
import com.ero.model.Emergency;
import com.ero.model.Ambulance;
import com.ero.repository.TrafficPoliceRepository;
import com.ero.repository.TrafficAssignmentRepository;
import com.ero.repository.EmergencyRepository;
import com.ero.repository.AmbulanceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TrafficService {

    private final TrafficPoliceRepository trafficPoliceRepository;
    private final TrafficAssignmentRepository trafficAssignmentRepository;
    private final EmergencyRepository emergencyRepository;
    private final AmbulanceRepository ambulanceRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final GeoLocationService geoLocationService;
    private final NotificationService notificationService;

    public List<TrafficPolice> getAllTrafficPolice() {
        return trafficPoliceRepository.findAll();
    }

    public List<TrafficPolice> getAvailableOfficers() {
        return trafficPoliceRepository.findByStatusIn(List.of(
                TrafficPolice.Status.PATROLLING,
                TrafficPolice.Status.ASSIGNED
        ));
    }

    public TrafficPolice getTrafficPoliceById(String id) {
        return trafficPoliceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Traffic police not found"));
    }

    public TrafficPolice getTrafficPoliceByOfficerUserId(String userId) {
        return trafficPoliceRepository.findByOfficerUserId(userId)
                .orElseThrow(() -> new RuntimeException("Traffic police not found for officer"));
    }

    @Transactional
    public TrafficPolice updateLocation(String trafficPoliceId, Double latitude, Double longitude) {
        TrafficPolice officer = getTrafficPoliceById(trafficPoliceId);
        officer.setCurrentLatitude(latitude);
        officer.setCurrentLongitude(longitude);
        officer = trafficPoliceRepository.save(officer);

        // Broadcast location update
        messagingTemplate.convertAndSend("/topic/traffic/" + trafficPoliceId + "/location", officer);
        messagingTemplate.convertAndSend("/topic/control/traffic", officer);

        return officer;
    }

    @Transactional
    public TrafficPolice updateStatus(String trafficPoliceId, TrafficPolice.Status status) {
        TrafficPolice officer = getTrafficPoliceById(trafficPoliceId);
        officer.setStatus(status);
        officer = trafficPoliceRepository.save(officer);

        // Broadcast status update
        messagingTemplate.convertAndSend("/topic/traffic/" + trafficPoliceId, officer);
        messagingTemplate.convertAndSend("/topic/control/traffic", officer);

        return officer;
    }

    @Transactional
    public TrafficAssignment createAssignment(String emergencyId, String officerId, 
                                             String junctionId, String junctionName) {
        TrafficAssignment assignment = new TrafficAssignment();
        assignment.setEmergencyId(emergencyId);
        assignment.setOfficerId(officerId);
        assignment.setJunctionId(junctionId);
        assignment.setJunctionName(junctionName);
        assignment.setStatus(TrafficAssignment.Status.ALERTED);
        
        assignment = trafficAssignmentRepository.save(assignment);

        // Update officer status
        TrafficPolice officer = getTrafficPoliceById(officerId);
        officer.setStatus(TrafficPolice.Status.ASSIGNED);
        trafficPoliceRepository.save(officer);

        // Broadcast
        messagingTemplate.convertAndSend("/topic/traffic/" + officerId + "/assignment", assignment);
        messagingTemplate.convertAndSend("/topic/emergency/" + emergencyId + "/traffic", assignment);

        return assignment;
    }

    @Transactional
    public TrafficAssignment acknowledgeAssignment(String assignmentId) {
        TrafficAssignment assignment = trafficAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        
        assignment.setStatus(TrafficAssignment.Status.ACKNOWLEDGED);
        assignment.setAcknowledgedAt(LocalDateTime.now());
        assignment = trafficAssignmentRepository.save(assignment);

        // Broadcast
        messagingTemplate.convertAndSend("/topic/emergency/" + assignment.getEmergencyId() + "/traffic", assignment);
        messagingTemplate.convertAndSend("/topic/control", assignment);

        return assignment;
    }

    @Transactional
    public TrafficAssignment startClearing(String assignmentId) {
        TrafficAssignment assignment = trafficAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        
        assignment.setStatus(TrafficAssignment.Status.ACTIVELY_CLEARING);
        assignment.setStartedClearingAt(LocalDateTime.now());
        assignment = trafficAssignmentRepository.save(assignment);

        // Update officer status
        TrafficPolice officer = getTrafficPoliceById(assignment.getOfficerId());
        officer.setStatus(TrafficPolice.Status.CLEARING_TRAFFIC);
        trafficPoliceRepository.save(officer);

        // Broadcast
        messagingTemplate.convertAndSend("/topic/emergency/" + assignment.getEmergencyId() + "/traffic", assignment);
        messagingTemplate.convertAndSend("/topic/control", assignment);

        return assignment;
    }

    @Transactional
    public TrafficAssignment completeAssignment(String assignmentId) {
        TrafficAssignment assignment = trafficAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        
        assignment.setStatus(TrafficAssignment.Status.COMPLETED);
        assignment.setCompletedAt(LocalDateTime.now());
        assignment.setIsCleared(true); // Mark as cleared
        assignment = trafficAssignmentRepository.save(assignment);

        // Update officer status back to available
        TrafficPolice officer = getTrafficPoliceById(assignment.getOfficerId());
        officer.setStatus(TrafficPolice.Status.PATROLLING);
        trafficPoliceRepository.save(officer);

        // Send notification to ambulance driver that traffic is cleared
        final TrafficAssignment finalAssignment = assignment; // Make effectively final for lambda
        emergencyRepository.findById(finalAssignment.getEmergencyId()).ifPresent(emergency -> {
            if (emergency.getAssignedAmbulanceId() != null) {
                ambulanceRepository.findById(emergency.getAssignedAmbulanceId()).ifPresent(ambulance -> {
                    if (ambulance.getOperatorUserId() != null) {
                        notificationService.createNotification(
                                ambulance.getOperatorUserId(),
                                "🚦 Traffic Cleared",
                                String.format("Traffic at %s has been cleared by traffic police.", 
                                        finalAssignment.getJunctionName()),
                                com.ero.model.Notification.NotificationType.TRAFFIC_CLEARED,
                                emergency.getId()
                        );
                        log.info("Sent traffic cleared notification for junction: {}", finalAssignment.getJunctionName());
                    }
                });
            }
        });

        // Broadcast
        messagingTemplate.convertAndSend("/topic/emergency/" + finalAssignment.getEmergencyId() + "/traffic", finalAssignment);
        messagingTemplate.convertAndSend("/topic/control", finalAssignment);

        return finalAssignment;
    }

    public List<TrafficAssignment> getAssignmentsByEmergencyId(String emergencyId) {
        return trafficAssignmentRepository.findByEmergencyId(emergencyId);
    }

    public List<TrafficAssignment> getAssignmentsByOfficerId(String officerId) {
        return trafficAssignmentRepository.findByOfficerId(officerId);
    }
}
