package com.ero.repository;

import com.ero.model.TrafficAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrafficAssignmentRepository extends JpaRepository<TrafficAssignment, String> {
    
    List<TrafficAssignment> findByEmergencyId(String emergencyId);
    
    List<TrafficAssignment> findByOfficerId(String officerId);
    
    List<TrafficAssignment> findByEmergencyIdAndStatus(String emergencyId, TrafficAssignment.Status status);
    
    List<TrafficAssignment> findByOfficerIdAndStatus(String officerId, TrafficAssignment.Status status);
    
    List<TrafficAssignment> findByStatus(TrafficAssignment.Status status);
    
    long countByEmergencyId(String emergencyId);
}
