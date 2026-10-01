package com.researchdesk.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.researchdesk.config.UserContextResolver;
import com.researchdesk.dto.auth.AuthResponse;
import com.researchdesk.dto.auth.LoginRequest;
import com.researchdesk.dto.auth.RegisterRequest;
import com.researchdesk.dto.auth.UserDto;
import com.researchdesk.exception.GlobalExceptionHandler;
import com.researchdesk.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private AuthService authService;

    @Mock
    private UserContextResolver userContextResolver;

    @InjectMocks
    private AuthController authController;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        mockMvc = MockMvcBuilders.standaloneSetup(authController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/auth/register - Success")
    void testRegisterSuccess() throws Exception {
        RegisterRequest req = RegisterRequest.builder()
                .name("Alice Cooper")
                .email("alice@university.edu")
                .password("password123")
                .build();

        AuthResponse resp = AuthResponse.builder()
                .token("mock-jwt-token")
                .user(UserDto.builder()
                        .id(userId)
                        .name("Alice Cooper")
                        .email("alice@university.edu")
                        .createdAt(LocalDateTime.now())
                        .build())
                .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(resp);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"))
                .andExpect(jsonPath("$.user.email").value("alice@university.edu"));
    }

    @Test
    @DisplayName("POST /api/auth/login - Success")
    void testLoginSuccess() throws Exception {
        LoginRequest req = LoginRequest.builder()
                .email("alice@university.edu")
                .password("password123")
                .build();

        AuthResponse resp = AuthResponse.builder()
                .token("mock-jwt-token")
                .user(UserDto.builder()
                        .id(userId)
                        .name("Alice Cooper")
                        .email("alice@university.edu")
                        .createdAt(LocalDateTime.now())
                        .build())
                .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(resp);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock-jwt-token"));
    }

    @Test
    @DisplayName("GET /api/auth/me - Success")
    void testGetMe() throws Exception {
        UserDto dto = UserDto.builder()
                .id(userId)
                .name("Alice Cooper")
                .email("alice@university.edu")
                .createdAt(LocalDateTime.now())
                .build();

        when(userContextResolver.resolveUserId(any(), any())).thenReturn(userId);
        when(authService.getCurrentUser(userId)).thenReturn(dto);

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Alice Cooper"))
                .andExpect(jsonPath("$.email").value("alice@university.edu"));
    }
}
