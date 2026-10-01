package com.researchdesk.repository;

import com.researchdesk.entity.Document;
import com.researchdesk.entity.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {
    List<Document> findByUserIdOrderByUploadedAtDesc(UUID userId);
    Optional<Document> findByIdAndUserId(UUID id, UUID userId);
    List<Document> findAllByIdIn(Collection<UUID> ids);
    long countByUserId(UUID userId);
    long countByUserIdAndStatus(UUID userId, DocumentStatus status);
}
