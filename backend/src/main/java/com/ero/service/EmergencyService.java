package com.ero.service;

import com.ero.model.Emergency;
import com.ero.model.Ambulance;
import com.ero.model.Hospital;
import com.ero.model.EmergencyHistory;
import com.ero.repository.EmergencyRepository;
import com.ero.repository.AmbulanceRepository;
import com.ero.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmergencyService {

    private final EmergencyRepository emergencyRepository;
    private final AmbulanceRepository ambulanceRepository;
    private final HospitalRepository hospitalRepository;
    private final GeoLocationService geoLocationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final PointsService pointsService;
    private final EmergencyHistoryService emergencyHistoryService;

    @Transactional
    public Emergency createEmergency(String citizenId, Double latitude, Double longitude, 
                                    String address, Emergency.Severity severity, String additionalInfo) {
        // Duplicate SOS prevention - check for emergencies within 5km
        // TEMPORARILY DISABLED FOR TESTING
        /*
        List<String> activeStatuses = Arrays.asList("CREATED", "DISPATCHED", "EN_ROUTE", "ARRIVED", "PATIENT_LOADED", "TRANSPORTING");
        List<Emergency> nearbyEmergencies = emergencyRepository.findNearbyEmergencies(
                latitude, longitude, 5.0, activeStatuses);
        
        if (!nearbyEmergencies.isEmpty()) {
            log.warn("Duplicate SOS attempt detected within 5km radius at location: {}, {}", latitude, longitude);
            throw new RuntimeException("DUPLICATE_SOS_DETECTED");
        }
        */
        
        Emergency emergency = new Emergency();
        emergency.setEmergencyCode("ERO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        emergency.setCitizenId(citizenId);
        emergency.setLatitude(latitude);
        emergency.setLongitude(longitude);
        emergency.setAddress(address);
        emergency.setSeverity(severity);
        emergency.setAdditionalInfo(additionalInfo);
        emergency.setStatus(Emergency.Status.CREATED);
        emergency.setPointsAwarded(false);

        emergency = emergencyRepository.save(emergency);
        log.info("Created emergency: {} at location: {}, {}", emergency.getEmergencyCode(), latitude, longitude);

        // Broadcast via WebSocket
        messagingTemplate.convertAndSend("/topic/emergencies", emergency);
        messagingTemplate.convertAndSend("/topic/control", emergency);

        return emergency;
    }

    @Transactional
    public Emergency assignAmbulance(String emergencyId, String ambulanceId) {
        Emergency emergency = emergencyRepository.findById(emergencyId)
                .orElseThrow(() -> new RuntimeException("Emergency not found"));
        
        Ambulance ambulance = ambulanceRepository.findById(ambulanceId)
                .orElseThrow(() -> new RuntimeException("Ambulance not found"));

        emergency.setAssignedAmbulanceId(ambulanceId);
        emergency.setStatus(Emergency.Status.DISPATCHED);
        emergency.setDispatchedAt(LocalDateTime.now());

        ambulance.setCurrentEmergencyId(emergencyId);
        ambulance.setStatus(Ambulance.Status.BUSY); // Changed to BUSY
        ambulance.setIsAvailable(false); // Lock availability

        emergencyRepository.save(emergency);
        ambulanceRepository.save(ambulance);

        // Send notification to ambulance driver
        if (ambulance.getOperatorUserId() != null) {
            notificationService.createNotification(
                    ambulance.getOperatorUserId(),
                    "🚨 New Emergency Assignment",
                    String.format("You have been assigned to emergency %s. Location: %s", 
                            emergency.getEmergencyCode(), emergency.getAddress()),
                    com.ero.model.Notification.NotificationType.EMERGENCY_ASSIGNED,
                    emergencyId
            );
        }

        // Send notification to citizen
        if (emergency.getCitizenId() != null && !emergency.getCitizenId().equals("guest")) {
            notificationService.createNotification(
                    emergency.getCitizenId(),
                    "🚑 Ambulance Dispatched",
                    String.format("Ambulance %s is on the way to your location. ETA: 5-10 mins", 
                            ambulance.getVehicleNumber()),
                    com.ero.model.Notification.NotificationType.EMERGENCY_ASSIGNED,
                    emergencyId
            );
        }

        // Broadcast
        messagingTemplate.convertAndSend("/topic/ambulance/" + ambulanceId, emergency);
        messagingTemplate.convertAndSend("/topic/emergency/" + emergencyId, emergency);

        log.info("Assigned ambulance {} to emergency {} - Notifications sent to ambulance and citizen", ambulanceId, emergencyId);
        return emergency;
    }

    @Transactional
    public Emergency assignHospital(String emergencyId) {
        Emergency emergency = emergencyRepository.findById(emergencyId)
                .orElseThrow(() -> new RuntimeException("Emergency not found"));

        // Find nearest hospital with available beds
        List<Hospital> hospitals = hospitalRepository.findNearestHospitalsWithBeds(
                emergency.getLatitude(), emergency.getLongitude(), 50.0);

        if (!hospitals.isEmpty()) {
            Hospital hospital = hospitals.get(0);
            emergency.setAssignedHospitalId(hospital.getId());
            
            // Decrease available beds
            hospital.setAvailableBeds(hospital.getAvailableBeds() - 1);
            hospitalRepository.save(hospital);

            emergencyRepository.save(emergency);

            // Send notification to hospital
            if (hospital.getAdminUserId() != null) {
                notificationService.createNotification(
                        hospital.getAdminUserId(),
                        "🏥 Incoming Emergency",
                        String.format("Emergency %s assigned to your hospital. Please prepare bed.", 
                                emergency.getEmergencyCode()),
                        com.ero.model.Notification.NotificationType.EMERGENCY_ASSIGNED,
                        emergencyId
                );
            }

            // Send notification to citizen
            if (emergency.getCitizenId() != null && !emergency.getCitizenId().equals("guest")) {
                notificationService.createNotification(
                        emergency.getCitizenId(),
                        "🛏️ Hospital Bed Reserved",
                        String.format("Bed reserved at %s. Ambulance will transport you there.", hospital.getName()),
                        com.ero.model.Notification.NotificationType.BED_ASSIGNED,
                        emergencyId
                );
            }

            // Send notification to ambulance driver
            if (emergency.getAssignedAmbulanceId() != null) {
                Ambulance ambulance = ambulanceRepository.findById(emergency.getAssignedAmbulanceId()).orElse(null);
                if (ambulance != null && ambulance.getOperatorUserId() != null) {
                    notificationService.createNotification(
                            ambulance.getOperatorUserId(),
                            "🏥 Hospital Destination Set",
                            String.format("Transport patient to %s. Bed is ready.", hospital.getName()),
                            com.ero.model.Notification.NotificationType.BED_ASSIGNED,
                            emergencyId
                    );
                }
            }

            // Broadcast
            messagingTemplate.convertAndSend("/topic/hospital/" + hospital.getId(), emergency);
            messagingTemplate.convertAndSend("/topic/emergency/" + emergencyId, emergency);
            
            log.info("Assigned hospital {} to emergency {} - Notifications sent to citizen, ambulance, and hospital", hospital.getId(), emergencyId);
        } else {
            log.warn("No hospitals available with beds for emergency {}", emergencyId);
        }

        return emergency;
    }

    @Transactional
    public Emergency updateStatus(String emergencyId, Emergency.Status newStatus) {
        Emergency emergency = emergencyRepository.findById(emergencyId)
                .orElseThrow(() -> new RuntimeException("Emergency not found"));

        Emergency.Status oldStatus = emergency.getStatus();
        emergency.setStatus(newStatus);

        switch (newStatus) {
            case EN_ROUTE:
                if (emergency.getDispatchedAt() != null) {
                    long responseTime = ChronoUnit.SECONDS.between(
                            emergency.getCreatedAt(), emergency.getDispatchedAt());
                    emergency.setResponseTimeSeconds((int) responseTime);
                }
                break;
            case ARRIVED:
                emergency.setArrivedAt(LocalDateTime.now());
                break;
            case PATIENT_LOADED:
                emergency.setPickupCompletedAt(LocalDateTime.now());
                break;
            case COMPLETED:
                emergency.setCompletedAt(LocalDateTime.now());
                if (emergency.getCreatedAt() != null) {
                    long totalTime = ChronoUnit.SECONDS.between(
                            emergency.getCreatedAt(), LocalDateTime.now());
                    emergency.setTotalTimeSeconds((int) totalTime);
                }
                
                // Release ambulance and reset status
                if (emergency.getAssignedAmbulanceId() != null) {
                    ambulanceRepository.findById(emergency.getAssignedAmbulanceId())
                            .ifPresent(amb -> {
                                amb.setStatus(Ambulance.Status.AVAILABLE);
                                amb.setCurrentEmergencyId(null);
                                amb.setIsAvailable(true); // Driver can now set availability
                                ambulanceRepository.save(amb);
                            });
                }
                
                // Don't release hospital bed yet - wait for admission mark
                
                // Award points only if not already awarded
                if (!emergency.getPointsAwarded()) {
                    awardPointsForEmergency(emergency);
                    emergency.setPointsAwarded(true);
                }
                
                // Create emergency history
                createEmergencyHistory(emergency);
                
                // Send completion notifications
                sendCompletionNotifications(emergency);
                
                log.info("Emergency {} completed successfully", emergency.getEmergencyCode());
                break;
        }

        emergency = emergencyRepository.save(emergency);

        // Broadcast
        messagingTemplate.convertAndSend("/topic/emergency/" + emergencyId, emergency);
        messagingTemplate.convertAndSend("/topic/control", emergency);

        return emergency;
    }

    public List<Emergency> getAllEmergencies() {
        return emergencyRepository.findAll();
    }

    public List<Emergency> getActiveEmergencies() {
        return emergencyRepository.findByStatusIn(List.of(
                Emergency.Status.CREATED,
                Emergency.Status.DISPATCHED,
                Emergency.Status.EN_ROUTE,
                Emergency.Status.ARRIVED,
                Emergency.Status.PATIENT_LOADED,
                Emergency.Status.TRANSPORTING
        ));
    }

    public Emergency getEmergencyById(String id) {
        return emergencyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Emergency not found"));
    }

    public Emergency getEmergencyByCode(String code) {
        return emergencyRepository.findByEmergencyCode(code)
                .orElseThrow(() -> new RuntimeException("Emergency not found"));
    }

    public List<Emergency> getEmergenciesByAmbulance(String ambulanceId) {
        // Only return truly active emergencies (exclude DELIVERED, COMPLETED and CANCELLED)
        List<Emergency.Status> activeStatuses = Arrays.asList(
            Emergency.Status.CREATED,
            Emergency.Status.DISPATCHED,
            Emergency.Status.EN_ROUTE,
            Emergency.Status.ARRIVED,
            Emergency.Status.PATIENT_LOADED,
            Emergency.Status.TRANSPORTING
        );
        return emergencyRepository.findByAssignedAmbulanceIdAndStatusIn(ambulanceId, activeStatuses);
    }
    
    public List<Emergency> getEmergenciesByHospital(String hospitalId) {
        // Only return active emergencies (exclude COMPLETED and CANCELLED)
        List<Emergency.Status> activeStatuses = Arrays.asList(
            Emergency.Status.CREATED,
            Emergency.Status.DISPATCHED,
            Emergency.Status.EN_ROUTE,
            Emergency.Status.ARRIVED,
            Emergency.Status.PATIENT_LOADED,
            Emergency.Status.TRANSPORTING,
            Emergency.Status.DELIVERED
        );
        return emergencyRepository.findByAssignedHospitalIdAndStatusIn(hospitalId, activeStatuses);
    }
    
    @Transactional
    public Emergency assignBedNumber(String emergencyId, String bedNumber) {
        Emergency emergency = emergencyRepository.findById(emergencyId)
                .orElseThrow(() -> new RuntimeException("Emergency not found"));
        
        emergency.setAssignedBedNumber(bedNumber);
        emergency = emergencyRepository.save(emergency);
        
        // Send notification to citizen and ambulance
        notificationService.createNotification(
                emergency.getCitizenId(),
                "🛏️ Bed Assigned",
                String.format("Bed number %s has been assigned for your emergency %s", 
                        bedNumber, emergency.getEmergencyCode()),
                com.ero.model.Notification.NotificationType.BED_ASSIGNED,
                emergencyId
        );
        
        if (emergency.getAssignedAmbulanceId() != null) {
            ambulanceRepository.findById(emergency.getAssignedAmbulanceId())
                    .ifPresent(amb -> {
                        if (amb.getOperatorUserId() != null) {
                            notificationService.createNotification(
                                    amb.getOperatorUserId(),
                                    "🛏️ Bed Assigned",
                                    String.format("Patient bed number: %s", bedNumber),
                                    com.ero.model.Notification.NotificationType.BED_ASSIGNED,
                                    emergencyId
                            );
                        }
                    });
        }
        
        // Broadcast
        messagingTemplate.convertAndSend("/topic/emergency/" + emergencyId, emergency);
        
        log.info("Assigned bed number {} to emergency {}", bedNumber, emergencyId);
        return emergency;
    }
    
    private void awardPointsForEmergency(Emergency emergency) {
        if (emergency.getCitizenId() == null) {
            return;
        }
        
        String ambulanceOperatorId = null;
        if (emergency.getAssignedAmbulanceId() != null) {
            ambulanceOperatorId = ambulanceRepository.findById(emergency.getAssignedAmbulanceId())
                    .map(Ambulance::getOperatorUserId)
                    .orElse(null);
        }
        
        // Get traffic police officer IDs from assignments
        List<String> trafficOfficerIds = List.of(); // TODO: Get from traffic assignments
        
        pointsService.awardPointsForEmergencyCompletion(
                emergency.getCitizenId(),
                ambulanceOperatorId,
                trafficOfficerIds,
                emergency.getId()
        );
    }
    
    private void createEmergencyHistory(Emergency emergency) {
        EmergencyHistory history = new EmergencyHistory();
        history.setEmergencyCode(emergency.getEmergencyCode());
        history.setCitizenId(emergency.getCitizenId());
        history.setAmbulanceId(emergency.getAssignedAmbulanceId());
        history.setHospitalId(emergency.getAssignedHospitalId());
        history.setLatitude(emergency.getLatitude());
        history.setLongitude(emergency.getLongitude());
        history.setAddress(emergency.getAddress());
        history.setAdditionalInfo(emergency.getAdditionalInfo());
        history.setAssignedBedNumber(emergency.getAssignedBedNumber());
        history.setResponseTimeSeconds(emergency.getResponseTimeSeconds());
        history.setTotalTimeSeconds(emergency.getTotalTimeSeconds());
        history.setPointsGiven(25); // Points per participant
        history.setCompletedAt(emergency.getCompletedAt());
        
        emergencyHistoryService.createHistory(history);
    }
    
    private void sendCompletionNotifications(Emergency emergency) {
        // Notify all stakeholders
        notificationService.createNotification(
                emergency.getCitizenId(),
                "✅ Emergency Completed",
                String.format("Your emergency %s has been successfully completed. Thank you!",
                        emergency.getEmergencyCode()),
                com.ero.model.Notification.NotificationType.EMERGENCY_COMPLETED,
                emergency.getId()
        );
    }
}
