package com.lifeflow.auth;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class AuthDtos {

    public static class LoginRequest {
        @NotBlank(message = "Username or email is required")
        private String username;

        @NotBlank(message = "Password is required")
        private String password;

        public LoginRequest() {}
        public LoginRequest(String username, String password) {
            this.username = username;
            this.password = password;
        }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        @NotBlank(message = "Username is required")
        private String username;

        @NotBlank(message = "Email is required")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;

        @NotBlank(message = "Full name is required")
        private String fullName;

        private String role = "ROLE_PARAMEDIC";

        public RegisterRequest() {}
        public RegisterRequest(String username, String email, String password, String fullName, String role) {
            this.username = username;
            this.email = email;
            this.password = password;
            this.fullName = fullName;
            this.role = role != null ? role : "ROLE_PARAMEDIC";
        }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    public static class AuthResponse {
        private String token;
        private Long userId;
        private String username;
        private String email;
        private String fullName;
        private List<String> roles;
        private String hospitalCode;
        private String hospitalName;
        private String department;

        public AuthResponse() {}
        public AuthResponse(String token, Long userId, String username, String email, String fullName, List<String> roles) {
            this.token = token;
            this.userId = userId;
            this.username = username;
            this.email = email;
            this.fullName = fullName;
            this.roles = roles;
        }

        public AuthResponse(String token, Long userId, String username, String email, String fullName, List<String> roles, String hospitalCode, String hospitalName, String department) {
            this.token = token;
            this.userId = userId;
            this.username = username;
            this.email = email;
            this.fullName = fullName;
            this.roles = roles;
            this.hospitalCode = hospitalCode;
            this.hospitalName = hospitalName;
            this.department = department;
        }

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public List<String> getRoles() { return roles; }
        public void setRoles(List<String> roles) { this.roles = roles; }

        public String getHospitalCode() { return hospitalCode; }
        public void setHospitalCode(String hospitalCode) { this.hospitalCode = hospitalCode; }

        public String getHospitalName() { return hospitalName; }
        public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
    }

    public static class UserSummaryDto {
        private Long id;
        private String username;
        private String email;
        private String fullName;
        private List<String> roles;
        private String hospitalCode;
        private String hospitalName;
        private String department;

        public UserSummaryDto() {}
        public UserSummaryDto(Long id, String username, String email, String fullName, List<String> roles) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.fullName = fullName;
            this.roles = roles;
        }

        public UserSummaryDto(Long id, String username, String email, String fullName, List<String> roles, String hospitalCode, String hospitalName, String department) {
            this.id = id;
            this.username = username;
            this.email = email;
            this.fullName = fullName;
            this.roles = roles;
            this.hospitalCode = hospitalCode;
            this.hospitalName = hospitalName;
            this.department = department;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public List<String> getRoles() { return roles; }
        public void setRoles(List<String> roles) { this.roles = roles; }

        public String getHospitalCode() { return hospitalCode; }
        public void setHospitalCode(String hospitalCode) { this.hospitalCode = hospitalCode; }

        public String getHospitalName() { return hospitalName; }
        public void setHospitalName(String hospitalName) { this.hospitalName = hospitalName; }

        public String getDepartment() { return department; }
        public void setDepartment(String department) { this.department = department; }
    }
}
