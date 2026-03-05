package com.ero.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "traffic_police")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrafficPolice {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "officer_user_id", nullable = false)
    private String officerUserId;

    @Column(name = "badge_number", unique = true, length = 20)
    private String badgeNumber;

    @Column(name = "current_latitude")
    private Double currentLatitude;

    @Column(name = "current_longitude")
    private Double currentLongitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    @Column(name = "assigned_junctions", columnDefinition = "TEXT")
    private String assignedJunctions; // JSON array of junction IDs

    @Column(name = "socket_id")
    private String socketId; // For WebSocket communication

    @UpdateTimestamp
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    public enum Status {
        PATROLLING,
        ASSIGNED,
        CLEARING_TRAFFIC,
        CORRIDOR_ACTIVE,
        OFFLINE
    }
}
