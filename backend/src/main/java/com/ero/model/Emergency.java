package com.ero.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "emergencies")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Emergency {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "emergency_code", unique = true)
    private String emergencyCode;

    @Column(name = "citizen_id")
    private String citizenId;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "address", length = 500)
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false)
    private Severity severity;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    @Column(name = "assigned_ambulance_id")
    private String assignedAmbulanceId;

    @Column(name = "assigned_hospital_id")
    private String assignedHospitalId;

    @Column(name = "additional_info", columnDefinition = "TEXT")
    private String additionalInfo; // Optional details from citizen

    @Column(name = "assigned_bed_number", length = 20)
    private String assignedBedNumber; // Hospital provides this

    @Column(name = "points_awarded")
    private Boolean pointsAwarded = false; // Track if points given

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "dispatched_at")
    private LocalDateTime dispatchedAt;

    @Column(name = "arrived_at")
    private LocalDateTime arrivedAt;

    @Column(name = "pickup_completed_at")
    private LocalDateTime pickupCompletedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "response_time_seconds")
    private Integer responseTimeSeconds;

    @Column(name = "total_time_seconds")
    private Integer totalTimeSeconds;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Severity {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum Status {
        CREATED, 
        DISPATCHED, 
        EN_ROUTE, 
        ARRIVED, 
        PATIENT_LOADED, 
        TRANSPORTING, 
        DELIVERED, 
        COMPLETED, 
        CANCELLED
    }
}
