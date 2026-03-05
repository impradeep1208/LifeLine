package com.ero.service;

import com.ero.model.Analytics;
import com.ero.model.Emergency;
import com.ero.repository.AnalyticsRepository;
import com.ero.repository.EmergencyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final AnalyticsRepository analyticsRepository;
    private final EmergencyRepository emergencyRepository;

    public Map<String, Object> getOverallAnalytics(LocalDateTime startDate, LocalDateTime endDate) {
        Map<String, Object> analytics = new HashMap<>();
        
        List<Emergency> emergencies = emergencyRepository.findByCreatedAtBetween(startDate, endDate);
        
        analytics.put("totalEmergencies", emergencies.size());
        analytics.put("completedEmergencies", emergencies.stream()
                .filter(e -> e.getStatus() == Emergency.Status.COMPLETED)
                .count());
        
        Double avgResponseTime = emergencyRepository.getAverageResponseTime();
        analytics.put("avgResponseTimeSeconds", avgResponseTime != null ? avgResponseTime : 0.0);
        
        // Calculate emergencies by severity
        Map<String, Long> bySeverity = new HashMap<>();
        for (Emergency.Severity severity : Emergency.Severity.values()) {
            long count = emergencies.stream()
                    .filter(e -> e.getSeverity() == severity)
                    .count();
            bySeverity.put(severity.name(), count);
        }
        analytics.put("emergenciesBySeverity", bySeverity);
        
        // Emergency heatmap data (locations)
        List<Map<String, Object>> heatmapData = emergencies.stream()
                .map(e -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("lat", e.getLatitude());
                    point.put("lng", e.getLongitude());
                    point.put("severity", e.getSeverity());
                    return point;
                })
                .toList();
        analytics.put("heatmapData", heatmapData);
        
        return analytics;
    }

    public Analytics saveAnalytics(Analytics analytics) {
        return analyticsRepository.save(analytics);
    }

    public List<Analytics> getAnalyticsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return analyticsRepository.findByDateBetween(startDate, endDate);
    }

    public List<Analytics> getAnalyticsByRegion(String region) {
        return analyticsRepository.findByRegion(region);
    }
}
