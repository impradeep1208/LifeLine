package com.ero.service;

import com.ero.model.EmergencyHistory;
import com.ero.repository.EmergencyHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmergencyHistoryService {

    private final EmergencyHistoryRepository emergencyHistoryRepository;

    public EmergencyHistory createHistory(EmergencyHistory history) {
        log.info("Creating emergency history for emergency code: {}", history.getEmergencyCode());
        return emergencyHistoryRepository.save(history);
    }

    public List<EmergencyHistory> getHistoryByCitizen(String citizenId) {
        return emergencyHistoryRepository.findByCitizenIdOrderByCompletedAtDesc(citizenId);
    }

    public List<EmergencyHistory> getHistoryByAmbulance(String ambulanceId) {
        return emergencyHistoryRepository.findByAmbulanceIdOrderByCompletedAtDesc(ambulanceId);
    }

    public List<EmergencyHistory> getHistoryByHospital(String hospitalId) {
        return emergencyHistoryRepository.findByHospitalIdOrderByCompletedAtDesc(hospitalId);
    }

    public List<EmergencyHistory> getAllHistory() {
        return emergencyHistoryRepository.findAllByOrderByCompletedAtDesc();
    }
}
