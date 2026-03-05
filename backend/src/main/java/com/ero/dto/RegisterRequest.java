package com.ero.dto;

import com.ero.model.User;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String username;
    private String password;
    private User.UserRole role;
    private String fullName;
    private String phone;
    private String email;
}
