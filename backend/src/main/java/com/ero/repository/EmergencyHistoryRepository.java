package com.ero.repository;

import com.ero.model.EmergencyHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmergencyHistoryRepository extends JpaRepository<EmergencyHistory, String> {
    List<EmergencyHistory> findByCitizenIdOrderByCompletedAtDesc(String citizenId);
    List<EmergencyHistory> findByAmbulanceIdOrderByCompletedAtDesc(String ambulanceId);
    List<EmergencyHistory> findByHospitalIdOrderByCompletedAtDesc(String hospitalId);
    List<EmergencyHistory> findAllByOrderByCompletedAtDesc();
}
