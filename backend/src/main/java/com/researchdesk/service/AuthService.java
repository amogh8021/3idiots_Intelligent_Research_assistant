package com.researchdesk.service;

import com.researchdesk.dto.auth.AuthResponse;
import com.researchdesk.dto.auth.LoginRequest;
import com.researchdesk.dto.auth.RegisterRequest;
import com.researchdesk.dto.auth.UserDto;

import java.util.UUID;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    UserDto getCurrentUser(UUID userId);
}
