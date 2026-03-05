package com.ero.dto;

import com.ero.model.Emergency;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateEmergencyRequest {
    private String citizenId;
    private Double latitude;
    private Double longitude;
    private String address;
    private Emergency.Severity severity;
    private String additionalInfo; // Optional additional details
}
