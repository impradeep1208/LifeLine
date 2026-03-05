package com.ero.repository;

import com.ero.model.Emergency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmergencyRepository extends JpaRepository<Emergency, String> {
    
    Optional<Emergency> findByEmergencyCode(String emergencyCode);
    
    List<Emergency> findByStatus(Emergency.Status status);
    
    List<Emergency> findByStatusIn(List<Emergency.Status> statuses);
    
    List<Emergency> findByCitizenId(String citizenId);
    
    List<Emergency> findByAssignedAmbulanceId(String ambulanceId);
    
    List<Emergency> findByAssignedAmbulanceIdAndStatusIn(String ambulanceId, List<Emergency.Status> statuses);
    
    List<Emergency> findByAssignedHospitalId(String hospitalId);
    
    List<Emergency> findByAssignedHospitalIdAndStatusIn(String hospitalId, List<Emergency.Status> statuses);
    
    List<Emergency> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    // Find emergencies within a certain radius (simplified query)
    @Query(value = "SELECT * FROM emergencies e WHERE " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(e.latitude)) * " +
            "cos(radians(e.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(e.latitude)))) < :radius " +
            "AND e.status IN :statuses",
            nativeQuery = true)
    List<Emergency> findNearbyEmergencies(
            @Param("lat") Double latitude,
            @Param("lng") Double longitude,
            @Param("radius") Double radiusKm,
            @Param("statuses") List<String> statuses
    );
    
    long countByStatus(Emergency.Status status);
    
    @Query("SELECT AVG(e.responseTimeSeconds) FROM Emergency e WHERE e.responseTimeSeconds IS NOT NULL")
    Double getAverageResponseTime();
}
