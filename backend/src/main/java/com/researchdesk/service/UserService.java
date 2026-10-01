package com.researchdesk.service;

import com.researchdesk.entity.User;
import com.researchdesk.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
    public static final String DEFAULT_USER_EMAIL = "researcher@researchdesk.ai";
    private UUID defaultUserId;

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostConstruct
    @Transactional
    public void initDefaultUser() {
        User user = userRepository.findByEmail(DEFAULT_USER_EMAIL).orElseGet(() -> {
            log.info("Creating default MVP researcher user ({})", DEFAULT_USER_EMAIL);
            return userRepository.save(User.builder()
                    .name("Dr. Eleanor Vance")
                    .email(DEFAULT_USER_EMAIL)
                    .passwordHash("not-used-in-mvp")
                    .createdAt(LocalDateTime.now())
                    .build());
        });
        this.defaultUserId = user.getId();
        log.info("Default researcher user active with ID: {}", this.defaultUserId);
    }

    public UUID getDefaultUserId() {
        return defaultUserId;
    }

    public User getDefaultUser() {
        return userRepository.findById(defaultUserId)
                .orElseThrow(() -> new IllegalStateException("Default user not found"));
    }
}
