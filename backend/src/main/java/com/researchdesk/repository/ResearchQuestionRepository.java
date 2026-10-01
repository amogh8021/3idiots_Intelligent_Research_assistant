package com.researchdesk.repository;

import com.researchdesk.entity.ResearchQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ResearchQuestionRepository extends JpaRepository<ResearchQuestion, UUID> {
    List<ResearchQuestion> findByUserIdOrderByCreatedAtDesc(UUID userId);
    long countByUserId(UUID userId);
}
