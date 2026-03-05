package com.ero.repository;

import com.ero.model.Ambulance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AmbulanceRepository extends JpaRepository<Ambulance, String> {
    
    Optional<Ambulance> findByVehicleNumber(String vehicleNumber);
    
    Optional<Ambulance> findByOperatorUserId(String operatorUserId);
    
    List<Ambulance> findByStatus(Ambulance.Status status);
    
    Optional<Ambulance> findByCurrentEmergencyId(String emergencyId);
    
    // Find available ambulances within a certain radius
    @Query(value = "SELECT * FROM ambulances a WHERE " +
            "a.status = 'AVAILABLE' AND a.is_available = true AND " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(a.current_latitude)) * " +
            "cos(radians(a.current_longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(a.current_latitude)))) < :radius " +
            "ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(a.current_latitude)) * " +
            "cos(radians(a.current_longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(a.current_latitude)))) ASC",
            nativeQuery = true)
    List<Ambulance> findNearestAvailableAmbulances(
            @Param("lat") Double latitude,
            @Param("lng") Double longitude,
            @Param("radius") Double radiusKm
    );
    
    List<Ambulance> findByIsAvailableTrue();
    
    long countByStatus(Ambulance.Status status);
}
