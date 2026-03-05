package com.ero.service;

import com.ero.model.Hospital;
import com.ero.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HospitalService {

    private final HospitalRepository hospitalRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<Hospital> getAllHospitals() {
        return hospitalRepository.findAll();
    }

    public List<Hospital> getActiveHospitals() {
        return hospitalRepository.findByIsActiveTrue();
    }

    public Hospital getHospitalById(String id) {
        return hospitalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hospital not found"));
    }

    public Hospital getHospitalByAdminUserId(String userId) {
        return hospitalRepository.findByAdminUserId(userId)
                .orElseThrow(() -> new RuntimeException("Hospital not found for admin"));
    }

    public List<Hospital> findNearestHospitalsWithBeds(Double latitude, Double longitude, Double radiusKm) {
        return hospitalRepository.findNearestHospitalsWithBeds(latitude, longitude, radiusKm);
    }

    @Transactional
    public Hospital updateAvailableBeds(String hospitalId, Integer availableBeds) {
        Hospital hospital = getHospitalById(hospitalId);
        
        if (availableBeds < 0 || availableBeds > hospital.getTotalBeds()) {
            throw new RuntimeException("Invalid bed count");
        }
        
        hospital.setAvailableBeds(availableBeds);
        hospital = hospitalRepository.save(hospital);

        // Broadcast update
        messagingTemplate.convertAndSend("/topic/hospitals", hospital);
        messagingTemplate.convertAndSend("/topic/control/hospitals", hospital);

        return hospital;
    }

    @Transactional
    public Hospital createHospital(String name, Double latitude, Double longitude, 
                                  String address, Integer totalBeds, String adminUserId) {
        Hospital hospital = new Hospital();
        hospital.setName(name);
        hospital.setLatitude(latitude);
        hospital.setLongitude(longitude);
        hospital.setAddress(address);
        hospital.setTotalBeds(totalBeds);
        hospital.setAvailableBeds(totalBeds);
        hospital.setAdminUserId(adminUserId);
        hospital.setIsActive(true);
        return hospitalRepository.save(hospital);
    }

    @Transactional
    public Hospital updateHospital(String hospitalId, Hospital updatedHospital) {
        Hospital hospital = getHospitalById(hospitalId);
        hospital.setName(updatedHospital.getName());
        hospital.setAddress(updatedHospital.getAddress());
        hospital.setContactPhone(updatedHospital.getContactPhone());
        hospital.setSpecializations(updatedHospital.getSpecializations());
        return hospitalRepository.save(hospital);
    }

    @Transactional
    public void deleteHospital(String hospitalId) {
        hospitalRepository.deleteById(hospitalId);
    }

    public Long getTotalAvailableBeds() {
        return hospitalRepository.getTotalAvailableBeds();
    }
}
