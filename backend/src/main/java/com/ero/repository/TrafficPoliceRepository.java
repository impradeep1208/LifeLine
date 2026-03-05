package com.ero.repository;

import com.ero.model.TrafficPolice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrafficPoliceRepository extends JpaRepository<TrafficPolice, String> {
    
    Optional<TrafficPolice> findByOfficerUserId(String officerUserId);
    
    Optional<TrafficPolice> findByBadgeNumber(String badgeNumber);
    
    List<TrafficPolice> findByStatus(TrafficPolice.Status status);
    
    List<TrafficPolice> findByStatusIn(List<TrafficPolice.Status> statuses);
    
    // Find nearest available traffic police officers
    @Query(value = "SELECT * FROM traffic_police tp WHERE " +
            "tp.status IN ('PATROLLING', 'ASSIGNED') AND " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(tp.current_latitude)) * " +
            "cos(radians(tp.current_longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(tp.current_latitude)))) < :radius " +
            "ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(tp.current_latitude)) * " +
            "cos(radians(tp.current_longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(tp.current_latitude)))) ASC",
            nativeQuery = true)
    List<TrafficPolice> findNearestAvailableOfficers(
            @Param("lat") Double latitude,
            @Param("lng") Double longitude,
            @Param("radius") Double radiusKm
    );
    
    long countByStatus(TrafficPolice.Status status);
}
