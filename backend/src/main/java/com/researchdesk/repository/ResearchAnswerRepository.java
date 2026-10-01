package com.researchdesk.repository;

import com.researchdesk.entity.ResearchAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ResearchAnswerRepository extends JpaRepository<ResearchAnswer, UUID> {
    Optional<ResearchAnswer> findByQuestionId(UUID questionId);
}
