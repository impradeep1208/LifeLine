package com.ero.service;

import com.ero.model.Ambulance;
import com.ero.repository.AmbulanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AmbulanceService {

    private final AmbulanceRepository ambulanceRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final GeoLocationService geoLocationService;

    public List<Ambulance> getAllAmbulances() {
        return ambulanceRepository.findAll();
    }

    public List<Ambulance> getAvailableAmbulances() {
        return ambulanceRepository.findByStatus(Ambulance.Status.AVAILABLE);
    }

    public Ambulance getAmbulanceById(String id) {
        return ambulanceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ambulance not found"));
    }

    public Ambulance getAmbulanceByOperatorUserId(String userId) {
        return ambulanceRepository.findByOperatorUserId(userId)
                .orElseThrow(() -> new RuntimeException("Ambulance not found for operator"));
    }

    public List<Ambulance> findNearestAmbulances(Double latitude, Double longitude, Double radiusKm) {
        return ambulanceRepository.findNearestAvailableAmbulances(latitude, longitude, radiusKm);
    }

    @Transactional
    public Ambulance updateLocation(String ambulanceId, Double latitude, Double longitude) {
        Ambulance ambulance = getAmbulanceById(ambulanceId);
        ambulance.setCurrentLatitude(latitude);
        ambulance.setCurrentLongitude(longitude);
        ambulance = ambulanceRepository.save(ambulance);

        // Broadcast location update
        messagingTemplate.convertAndSend("/topic/ambulance/" + ambulanceId + "/location", ambulance);
        messagingTemplate.convertAndSend("/topic/control/ambulances", ambulance);
        
        if (ambulance.getCurrentEmergencyId() != null) {
            messagingTemplate.convertAndSend("/topic/emergency/" + 
                    ambulance.getCurrentEmergencyId() + "/ambulance", ambulance);
        }

        return ambulance;
    }

    @Transactional
    public Ambulance updateStatus(String ambulanceId, Ambulance.Status status) {
        Ambulance ambulance = getAmbulanceById(ambulanceId);
        ambulance.setStatus(status);
        ambulance = ambulanceRepository.save(ambulance);

        // Broadcast status update
        messagingTemplate.convertAndSend("/topic/ambulance/" + ambulanceId, ambulance);
        messagingTemplate.convertAndSend("/topic/control/ambulances", ambulance);

        return ambulance;
    }

    @Transactional
    public Ambulance setAvailability(String ambulanceId, Boolean isAvailable) {
        Ambulance ambulance = getAmbulanceById(ambulanceId);
        
        // Only allow changing availability if not currently assigned to an emergency
        if (ambulance.getCurrentEmergencyId() != null) {
            throw new RuntimeException("Cannot change availability while assigned to an emergency");
        }
        
        ambulance.setIsAvailable(isAvailable);
        if (isAvailable) {
            ambulance.setStatus(Ambulance.Status.AVAILABLE);
        } else {
            ambulance.setStatus(Ambulance.Status.OFFLINE);
        }
        
        ambulance = ambulanceRepository.save(ambulance);

        // Broadcast availability update
        messagingTemplate.convertAndSend("/topic/ambulance/" + ambulanceId, ambulance);
        messagingTemplate.convertAndSend("/topic/control/ambulances", ambulance);

        return ambulance;
    }

    @Transactional
    public Ambulance createAmbulance(String vehicleNumber, String operatorUserId, String equipment) {
        Ambulance ambulance = new Ambulance();
        ambulance.setVehicleNumber(vehicleNumber);
        ambulance.setOperatorUserId(operatorUserId);
        ambulance.setEquipment(equipment);
        ambulance.setStatus(Ambulance.Status.OFFLINE);
        return ambulanceRepository.save(ambulance);
    }

    @Transactional
    public void deleteAmbulance(String ambulanceId) {
        ambulanceRepository.deleteById(ambulanceId);
    }
}
