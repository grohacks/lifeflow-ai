package com.lifeflow.auth;

import com.lifeflow.common.ResourceNotFoundException;
import com.lifeflow.common.ValidationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final com.lifeflow.hospital.HospitalRepository hospitalRepository;

    public AuthService(AuthenticationManager authenticationManager,
                       UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       com.lifeflow.hospital.HospitalRepository hospitalRepository) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.hospitalRepository = hospitalRepository;
    }

    @Transactional(readOnly = true)
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userDetails.getUsername()));

        String token = jwtService.generateToken(userDetails, user.getId(), user.getFullName(), user.getEmail());

        List<String> roles = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        String hospName = user.getHospitalCode() != null
                ? hospitalRepository.findByHospitalCode(user.getHospitalCode()).map(com.lifeflow.hospital.Hospital::getName).orElse(null)
                : null;

        return new AuthDtos.AuthResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                roles,
                user.getHospitalCode(),
                hospName,
                user.getDepartment()
        );
    }

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ValidationException("Username '" + request.getUsername() + "' is already taken.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ValidationException("Email '" + request.getEmail() + "' is already in use.");
        }

        String roleName = request.getRole() != null && !request.getRole().isBlank() 
                ? request.getRole() 
                : "ROLE_PARAMEDIC";

        // Ensure role starts with ROLE_
        if (!roleName.startsWith("ROLE_")) {
            roleName = "ROLE_" + roleName;
        }

        final String finalRoleName = roleName;
        Role role = roleRepository.findByName(finalRoleName).orElseGet(() -> {
            Role newRole = new Role(finalRoleName, finalRoleName.replace("ROLE_", "") + " role");
            return roleRepository.save(newRole);
        });

        User user = new User(
                request.getUsername(),
                request.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                request.getFullName()
        );
        user.setRoles(Set.of(role));
        user.setActive(true);

        User savedUser = userRepository.save(user);

        // Generate JWT token for immediate session access
        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                savedUser.getUsername(),
                savedUser.getPasswordHash(),
                List.of(new SimpleGrantedAuthority(finalRoleName))
        );

        String token = jwtService.generateToken(userDetails, savedUser.getId(), savedUser.getFullName(), savedUser.getEmail());

        return new AuthDtos.AuthResponse(
                token,
                savedUser.getId(),
                savedUser.getUsername(),
                savedUser.getEmail(),
                savedUser.getFullName(),
                List.of(finalRoleName)
        );
    }

    @Transactional(readOnly = true)
    public List<AuthDtos.UserSummaryDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(u -> {
                    String hName = u.getHospitalCode() != null
                            ? hospitalRepository.findByHospitalCode(u.getHospitalCode()).map(com.lifeflow.hospital.Hospital::getName).orElse(null)
                            : null;
                    return new AuthDtos.UserSummaryDto(
                            u.getId(),
                            u.getUsername(),
                            u.getEmail(),
                            u.getFullName(),
                            u.getRoles().stream().map(Role::getName).collect(Collectors.toList()),
                            u.getHospitalCode(),
                            hName,
                            u.getDepartment()
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AuthDtos.UserSummaryDto getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal().equals("anonymousUser")) {
            throw new ResourceNotFoundException("No authenticated user found in session");
        }

        String username = auth.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        String hName = user.getHospitalCode() != null
                ? hospitalRepository.findByHospitalCode(user.getHospitalCode()).map(com.lifeflow.hospital.Hospital::getName).orElse(null)
                : null;

        return new AuthDtos.UserSummaryDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getFullName(),
                roles,
                user.getHospitalCode(),
                hName,
                user.getDepartment()
        );
    }
}
