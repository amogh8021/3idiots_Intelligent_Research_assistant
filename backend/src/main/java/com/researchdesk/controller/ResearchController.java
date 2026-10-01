package com.researchdesk.controller;

import com.researchdesk.config.UserContextResolver;
import com.researchdesk.dto.AskQuestionRequest;
import com.researchdesk.dto.AskQuestionResponse;
import com.researchdesk.dto.ResearchHistoryItemResponse;
import com.researchdesk.dto.SynthesizeRequest;
import com.researchdesk.service.ResearchService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/research")
public class ResearchController {

    private static final Logger log = LoggerFactory.getLogger(ResearchController.class);

    private final ResearchService researchService;
    private final UserContextResolver userContextResolver;

    public ResearchController(ResearchService researchService, UserContextResolver userContextResolver) {
        this.researchService = researchService;
        this.userContextResolver = userContextResolver;
    }

    private UUID resolveUserId(String authHeader, UUID headerUserId) {
        return userContextResolver.resolveUserId(authHeader, headerUserId);
    }

    @PostMapping("/ask")
    public ResponseEntity<AskQuestionResponse> askQuestion(
            @Valid @RequestBody AskQuestionRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {
        UUID userId = resolveUserId(authHeader, headerUserId);
        log.info("[QUERY_RECEIVED] userId={}, documentIds={}, question='{}'",
                userId, request.getDocumentIds(), request.getQuestion());
        AskQuestionResponse response = researchService.askQuestion(request, userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/synthesize")
    public ResponseEntity<AskQuestionResponse> synthesizeDocuments(
            @Valid @RequestBody SynthesizeRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {
        UUID userId = resolveUserId(authHeader, headerUserId);
        log.info("[SYNTHESIZE_QUERY_RECEIVED] userId={}, documentIds={}, focus='{}'",
                userId, request.getDocumentIds(), request.getFocus());

        String generatedPrompt;
        switch (request.getFocus().toLowerCase()) {
            case "methodology":
                generatedPrompt = "Provide a comprehensive comparative analysis of the experimental methodologies, architectures, and empirical datasets used across these papers.";
                break;
            case "limitations":
                generatedPrompt = "Extract and synthesize the critical limitations, failure cases, threats to validity, and proposed future research directions from these papers.";
                break;
            case "comparison":
                generatedPrompt = "Construct a comparative synthesis matrix detailing key benchmarks, performance trade-offs, and consensus versus divergence among the authors.";
                break;
            case "executive":
            default:
                generatedPrompt = "Generate an executive academic literature summary synthesizing the primary contributions, breakthrough discoveries, and collective implications of these research works.";
                break;
        }

        AskQuestionRequest queryRequest = AskQuestionRequest.builder()
                .documentIds(request.getDocumentIds())
                .question(generatedPrompt)
                .build();

        AskQuestionResponse response = researchService.askQuestion(queryRequest, userId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history")
    public ResponseEntity<List<ResearchHistoryItemResponse>> getHistory(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {
        UUID userId = resolveUserId(authHeader, headerUserId);
        List<ResearchHistoryItemResponse> history = researchService.getHistory(userId);
        return ResponseEntity.ok(history);
    }
}
