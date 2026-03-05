package com.ero.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "emergency_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmergencyHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "emergency_code")
    private String emergencyCode;

    @Column(name = "citizen_id")
    private String citizenId;

    @Column(name = "ambulance_id")
    private String ambulanceId;

    @Column(name = "hospital_id")
    private String hospitalId;

    @Column(name = "traffic_police_ids", columnDefinition = "TEXT")
    private String trafficPoliceIds; // JSON array

    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "additional_info", columnDefinition = "TEXT")
    private String additionalInfo;

    @Column(name = "assigned_bed_number", length = 20)
    private String assignedBedNumber;

    @Column(name = "response_time_seconds")
    private Integer responseTimeSeconds;

    @Column(name = "total_time_seconds")
    private Integer totalTimeSeconds;

    @Column(name = "points_given")
    private Integer pointsGiven;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
