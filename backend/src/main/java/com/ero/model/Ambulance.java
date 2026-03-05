package com.ero.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "ambulances")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ambulance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "vehicle_number", unique = true, nullable = false, length = 20)
    private String vehicleNumber;

    @Column(name = "operator_user_id")
    private String operatorUserId;

    @Column(name = "current_latitude")
    private Double currentLatitude;

    @Column(name = "current_longitude")
    private Double currentLongitude;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    @Column(name = "equipment", columnDefinition = "TEXT")
    private String equipment; // JSON string: ["defibrillator", "oxygen", "trauma_kit"]

    @Column(name = "current_emergency_id")
    private String currentEmergencyId;

    @Column(name = "socket_id")
    private String socketId; // For WebSocket communication

    @UpdateTimestamp
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Column(name = "is_available")
    private Boolean isAvailable = true; // Driver can set this

    public enum Status {
        AVAILABLE,
        BUSY, // Automatically set when assigned
        EN_ROUTE,
        AT_SCENE,
        TRANSPORTING,
        OFFLINE
    }
}
