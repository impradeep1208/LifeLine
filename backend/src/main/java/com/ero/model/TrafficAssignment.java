package com.ero.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "traffic_assignments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TrafficAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "emergency_id", nullable = false)
    private String emergencyId;

    @Column(name = "officer_id", nullable = false)
    private String officerId;

    @Column(name = "junction_id", nullable = false)
    private String junctionId;

    @Column(name = "junction_name", length = 200)
    private String junctionName;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private Status status;

    @CreationTimestamp
    @Column(name = "alerted_at", updatable = false)
    private LocalDateTime alertedAt;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    @Column(name = "started_clearing_at")
    private LocalDateTime startedClearingAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "is_cleared")
    private Boolean isCleared = false; // Traffic police marks as cleared

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Status {
        ALERTED,
        ACKNOWLEDGED,
        ACTIVELY_CLEARING,
        COMPLETED,
        FAILED
    }
}
