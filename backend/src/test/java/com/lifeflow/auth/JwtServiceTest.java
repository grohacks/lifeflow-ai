package com.lifeflow.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    public void setUp() {
        String testSecret = "super_secret_jwt_key_at_least_256_bits_for_testing_lifeflow_platform_2026!";
        long testExpirationMs = 3600000L; // 1 hour
        jwtService = new JwtService(testSecret, testExpirationMs);
    }

    @Test
    public void testTokenGenerationAndValidation() {
        UserDetails userDetails = new User("paramedic1", "password", 
                List.of(new SimpleGrantedAuthority("ROLE_PARAMEDIC")));

        String token = jwtService.generateToken(userDetails, 10L, "John Paramedic", "paramedic@lifeflow.local");
        assertNotNull(token);
        assertTrue(token.length() > 20);

        assertTrue(jwtService.validateToken(token, userDetails));
        assertEquals("paramedic1", jwtService.extractUsername(token));
        assertEquals("John Paramedic", jwtService.getClaims(token).get("fullName"));
        assertEquals(10, ((Number) jwtService.getClaims(token).get("userId")).longValue());
    }

    @Test
    public void testInvalidUserFailsValidation() {
        UserDetails userDetails = new User("paramedic1", "password", Collections.emptyList());
        UserDetails otherUser = new User("paramedic2", "password", Collections.emptyList());

        String token = jwtService.generateToken(userDetails, 10L, "John", "john@test.com");
        assertFalse(jwtService.validateToken(token, otherUser));
    }
}
