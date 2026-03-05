package com.ero.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "analytics")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Analytics {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "date")
    private LocalDateTime date;

    @Column(name = "total_emergencies")
    private Integer totalEmergencies = 0;

    @Column(name = "avg_response_time_seconds")
    private Double avgResponseTimeSeconds;

    @Column(name = "ambulances_utilized")
    private Integer ambulancesUtilized = 0;

    @Column(name = "traffic_corridors_cleared")
    private Integer trafficCorridorsCleared = 0;

    @Column(name = "region", length = 100)
    private String region;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
