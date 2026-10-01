package com.researchdesk.service;

import com.researchdesk.dto.AskQuestionResponse;

import java.util.List;
import java.util.UUID;

public interface AiService {
    AskQuestionResponse askQuestion(
            List<UUID> documentIds,
            String question
    );

    boolean indexDocument(UUID documentId, String blobName);

    boolean indexDocumentWithContent(UUID documentId, String textContent);

    void deleteDocumentIndex(UUID documentId);
}
