package com.ero.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "hospitals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Hospital {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "latitude", nullable = false)
    private Double latitude;

    @Column(name = "longitude", nullable = false)
    private Double longitude;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "available_beds", nullable = false)
    private Integer availableBeds;

    @Column(name = "total_beds", nullable = false)
    private Integer totalBeds;

    @Column(name = "specializations", columnDefinition = "TEXT")
    private String specializations; // JSON string

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(name = "admin_user_id")
    private String adminUserId;

    @Column(name = "socket_id")
    private String socketId; // For WebSocket communication

    @UpdateTimestamp
    @Column(name = "last_updated")
    private LocalDateTime lastUpdated;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Column(name = "booked_beds", columnDefinition = "TEXT")
    private String bookedBeds; // JSON array of booked bed numbers
}
