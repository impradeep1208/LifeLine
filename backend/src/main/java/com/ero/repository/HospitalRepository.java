package com.ero.repository;

import com.ero.model.Hospital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HospitalRepository extends JpaRepository<Hospital, String> {
    
    List<Hospital> findByIsActiveTrue();
    
    Optional<Hospital> findByAdminUserId(String adminUserId);
    
    List<Hospital> findByAvailableBedsGreaterThan(Integer beds);
    
    // Find nearest hospitals with available beds
    @Query(value = "SELECT * FROM hospitals h WHERE " +
            "h.is_active = true AND h.available_beds > 0 AND " +
            "(6371 * acos(cos(radians(:lat)) * cos(radians(h.latitude)) * " +
            "cos(radians(h.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(h.latitude)))) < :radius " +
            "ORDER BY (6371 * acos(cos(radians(:lat)) * cos(radians(h.latitude)) * " +
            "cos(radians(h.longitude) - radians(:lng)) + " +
            "sin(radians(:lat)) * sin(radians(h.latitude)))) ASC",
            nativeQuery = true)
    List<Hospital> findNearestHospitalsWithBeds(
            @Param("lat") Double latitude,
            @Param("lng") Double longitude,
            @Param("radius") Double radiusKm
    );
    
    @Query("SELECT SUM(h.availableBeds) FROM Hospital h WHERE h.isActive = true")
    Long getTotalAvailableBeds();
}
