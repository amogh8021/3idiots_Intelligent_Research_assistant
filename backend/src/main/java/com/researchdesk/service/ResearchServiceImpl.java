package com.researchdesk.service;

import com.researchdesk.dto.AskQuestionRequest;
import com.researchdesk.dto.AskQuestionResponse;
import com.researchdesk.dto.ResearchHistoryItemResponse;
import com.researchdesk.entity.Document;
import com.researchdesk.entity.ResearchAnswer;
import com.researchdesk.entity.ResearchQuestion;
import com.researchdesk.repository.DocumentRepository;
import com.researchdesk.repository.ResearchAnswerRepository;
import com.researchdesk.repository.ResearchQuestionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ResearchServiceImpl implements ResearchService {

    private static final Logger log = LoggerFactory.getLogger(ResearchServiceImpl.class);

    private final AiService aiService;
    private final ResearchQuestionRepository questionRepository;
    private final ResearchAnswerRepository answerRepository;
    private final DocumentRepository documentRepository;

    public ResearchServiceImpl(
            AiService aiService,
            ResearchQuestionRepository questionRepository,
            ResearchAnswerRepository answerRepository,
            DocumentRepository documentRepository) {
        this.aiService = aiService;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.documentRepository = documentRepository;
    }

    @Override
    @Transactional
    public AskQuestionResponse askQuestion(AskQuestionRequest request, UUID userId) {
        log.info("Processing research query for user {}: '{}' across {} documents",
                userId, request.getQuestion(), request.getDocumentIds().size());

        // Call the AI/RAG service
        AskQuestionResponse response = aiService.askQuestion(request.getDocumentIds(), request.getQuestion());

        // Persist question
        ResearchQuestion researchQuestion = ResearchQuestion.builder()
                .userId(userId)
                .question(request.getQuestion())
                .createdAt(LocalDateTime.now())
                .build();
        researchQuestion = questionRepository.save(researchQuestion);

        // Persist answer
        ResearchAnswer researchAnswer = ResearchAnswer.builder()
                .questionId(researchQuestion.getId())
                .answer(response.getAnswer())
                .createdAt(LocalDateTime.now())
                .build();
        answerRepository.save(researchAnswer);

        log.info("Recorded research question (ID: {}) and answer in database", researchQuestion.getId());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResearchHistoryItemResponse> getHistory(UUID userId) {
        List<ResearchQuestion> questions = questionRepository.findByUserIdOrderByCreatedAtDesc(userId);

        return questions.stream().map(q -> {
            Optional<ResearchAnswer> ans = answerRepository.findByQuestionId(q.getId());
            return ResearchHistoryItemResponse.builder()
                    .questionId(q.getId())
                    .question(q.getQuestion())
                    .answer(ans.map(ResearchAnswer::getAnswer).orElse(""))
                    .createdAt(q.getCreatedAt())
                    .documentIds(Collections.emptyList())
                    .documentNames(Collections.emptyList())
                    .sources(Collections.emptyList())
                    .build();
        }).collect(Collectors.toList());
    }
}
