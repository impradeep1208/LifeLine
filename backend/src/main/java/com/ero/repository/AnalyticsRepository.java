package com.ero.repository;

import com.ero.model.Analytics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AnalyticsRepository extends JpaRepository<Analytics, String> {
    List<Analytics> findByDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    List<Analytics> findByRegion(String region);
    
    @Query("SELECT SUM(a.totalEmergencies) FROM Analytics a WHERE a.date BETWEEN ?1 AND ?2")
    Integer sumTotalEmergenciesBetweenDates(LocalDateTime startDate, LocalDateTime endDate);
    
    @Query("SELECT AVG(a.avgResponseTimeSeconds) FROM Analytics a WHERE a.date BETWEEN ?1 AND ?2")
    Double avgResponseTimeBetweenDates(LocalDateTime startDate, LocalDateTime endDate);
}
