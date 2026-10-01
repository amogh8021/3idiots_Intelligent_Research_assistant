package com.researchdesk.service;

import com.researchdesk.dto.AskQuestionRequest;
import com.researchdesk.dto.AskQuestionResponse;
import com.researchdesk.dto.ResearchHistoryItemResponse;

import java.util.List;
import java.util.UUID;

public interface ResearchService {
    AskQuestionResponse askQuestion(AskQuestionRequest request, UUID userId);
    List<ResearchHistoryItemResponse> getHistory(UUID userId);
}
