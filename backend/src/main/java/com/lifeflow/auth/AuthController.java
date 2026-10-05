package com.lifeflow.auth;

import com.lifeflow.common.ApiResponse;
import com.lifeflow.common.CorrelationIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthDtos.AuthResponse>> login(
            @Valid @RequestBody AuthDtos.LoginRequest request,
            HttpServletRequest servletRequest) {
        String correlationId = CorrelationIdFilter.getCorrelationId(servletRequest);
        AuthDtos.AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful", response, correlationId));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthDtos.AuthResponse>> register(
            @Valid @RequestBody AuthDtos.RegisterRequest request,
            HttpServletRequest servletRequest) {
        String correlationId = CorrelationIdFilter.getCorrelationId(servletRequest);
        AuthDtos.AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.ok("User registered successfully", response, correlationId));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<AuthDtos.UserSummaryDto>>> getAllUsers(HttpServletRequest servletRequest) {
        String correlationId = CorrelationIdFilter.getCorrelationId(servletRequest);
        List<AuthDtos.UserSummaryDto> users = authService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok(users, correlationId));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthDtos.UserSummaryDto>> getCurrentUser(HttpServletRequest servletRequest) {
        String correlationId = CorrelationIdFilter.getCorrelationId(servletRequest);
        AuthDtos.UserSummaryDto user = authService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(user, correlationId));
    }
}
