package com.researchdesk.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.researchdesk.dto.AskQuestionRequest;
import com.researchdesk.dto.AskQuestionResponse;
import com.researchdesk.dto.ResearchHistoryItemResponse;
import com.researchdesk.dto.SourceResponse;
import com.researchdesk.exception.AiServiceUnavailableException;
import com.researchdesk.exception.GlobalExceptionHandler;
import com.researchdesk.config.UserContextResolver;
import com.researchdesk.service.ResearchService;
import com.researchdesk.service.UserService;
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
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ResearchControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ResearchService researchService;

    @Mock
    private UserContextResolver userContextResolver;

    @InjectMocks
    private ResearchController researchController;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        lenient().when(userContextResolver.resolveUserId(any(), any())).thenReturn(userId);
        mockMvc = MockMvcBuilders.standaloneSetup(researchController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/research/ask - Success with sources")
    void testAskQuestionSuccess() throws Exception {
        UUID docId = UUID.randomUUID();
        AskQuestionRequest request = AskQuestionRequest.builder()
                .documentIds(List.of(docId))
                .question("What is the primary contribution?")
                .build();

        AskQuestionResponse response = AskQuestionResponse.builder()
                .answer("The paper introduces a scalable architecture.")
                .sources(List.of(SourceResponse.builder()
                        .documentId(docId)
                        .fileName("contribution.pdf")
                        .page(3)
                        .snippet("Our main contribution is...")
                        .build()))
                .build();

        when(researchService.askQuestion(any(), eq(userId))).thenReturn(response);

        mockMvc.perform(post("/api/research/ask")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value("The paper introduces a scalable architecture."))
                .andExpect(jsonPath("$.sources[0].fileName").value("contribution.pdf"))
                .andExpect(jsonPath("$.sources[0].page").value(3));
    }

    @Test
    @DisplayName("POST /api/research/ask - Validation failure on blank question")
    void testAskQuestionBlankQuestion() throws Exception {
        AskQuestionRequest request = AskQuestionRequest.builder()
                .documentIds(List.of(UUID.randomUUID()))
                .question("")
                .build();

        mockMvc.perform(post("/api/research/ask")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("POST /api/research/ask - 503 when AI service unavailable")
    void testAskQuestionAiUnavailable() throws Exception {
        AskQuestionRequest request = AskQuestionRequest.builder()
                .documentIds(List.of(UUID.randomUUID()))
                .question("Valid question")
                .build();

        when(researchService.askQuestion(any(), eq(userId)))
                .thenThrow(new AiServiceUnavailableException("AI service connection refused"));

        mockMvc.perform(post("/api/research/ask")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.error").value("AI_SERVICE_UNAVAILABLE"));
    }

    @Test
    @DisplayName("GET /api/research/history - Returns history list")
    void testGetHistory() throws Exception {
        ResearchHistoryItemResponse item = ResearchHistoryItemResponse.builder()
                .questionId(UUID.randomUUID())
                .question("What is RAG?")
                .answer("Retrieval-Augmented Generation enhances LLMs.")
                .createdAt(LocalDateTime.now())
                .build();

        when(researchService.getHistory(userId)).thenReturn(List.of(item));

        mockMvc.perform(get("/api/research/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].question").value("What is RAG?"))
                .andExpect(jsonPath("$[0].answer").value("Retrieval-Augmented Generation enhances LLMs."));
    }
}
