package com.researchdesk.config;

import com.researchdesk.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class UserContextResolver {

    private static final Logger log = LoggerFactory.getLogger(UserContextResolver.class);

    private final JwtTokenService jwtTokenService;
    private final UserService userService;

    public UserContextResolver(JwtTokenService jwtTokenService, UserService userService) {
        this.jwtTokenService = jwtTokenService;
        this.userService = userService;
    }

    public UUID resolveUserId(String authHeader, UUID headerUserId) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            try {
                if (jwtTokenService.validateToken(token)) {
                    return jwtTokenService.getUserIdFromToken(token);
                }
            } catch (Exception e) {
                log.warn("Failed to extract user from JWT token: {}", e.getMessage());
            }
        }

        if (headerUserId != null) {
            return headerUserId;
        }

        return userService.getDefaultUserId();
    }
}
