package com.researchdesk.controller;

import com.researchdesk.config.UserContextResolver;
import com.researchdesk.dto.auth.AuthResponse;
import com.researchdesk.dto.auth.LoginRequest;
import com.researchdesk.dto.auth.RegisterRequest;
import com.researchdesk.dto.auth.UserDto;
import com.researchdesk.service.AuthService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final UserContextResolver userContextResolver;

    public AuthController(AuthService authService, UserContextResolver userContextResolver) {
        this.authService = authService;
        this.userContextResolver = userContextResolver;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Received registration request for: {}", request.getEmail());
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Received login request for: {}", request.getEmail());
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {
        UUID userId = userContextResolver.resolveUserId(authHeader, headerUserId);
        UserDto user = authService.getCurrentUser(userId);
        return ResponseEntity.ok(user);
    }
}
