package com.researchdesk.service;

import com.researchdesk.dto.AskQuestionRequest;
import com.researchdesk.dto.AskQuestionResponse;
import com.researchdesk.dto.ResearchHistoryItemResponse;
import com.researchdesk.entity.ResearchAnswer;
import com.researchdesk.entity.ResearchQuestion;
import com.researchdesk.repository.DocumentRepository;
import com.researchdesk.repository.ResearchAnswerRepository;
import com.researchdesk.repository.ResearchQuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResearchServiceTest {

    @Mock
    private AiService aiService;

    @Mock
    private ResearchQuestionRepository questionRepository;

    @Mock
    private ResearchAnswerRepository answerRepository;

    @Mock
    private DocumentRepository documentRepository;

    @InjectMocks
    private ResearchServiceImpl researchService;

    private UUID userId;
    private UUID docId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        docId = UUID.randomUUID();
    }

    @Test
    @DisplayName("Should ask question, delegate to AI service, and record question & answer")
    void testAskQuestionSuccess() {
        AskQuestionRequest request = AskQuestionRequest.builder()
                .documentIds(List.of(docId))
                .question("What are the major findings?")
                .build();

        AskQuestionResponse aiResponse = AskQuestionResponse.builder()
                .answer("The paper introduces a novel optimization...")
                .sources(List.of())
                .build();

        when(aiService.askQuestion(request.getDocumentIds(), request.getQuestion()))
                .thenReturn(aiResponse);

        when(questionRepository.save(any(ResearchQuestion.class))).thenAnswer(inv -> {
            ResearchQuestion q = inv.getArgument(0);
            q.setId(UUID.randomUUID());
            return q;
        });

        when(answerRepository.save(any(ResearchAnswer.class))).thenAnswer(inv -> inv.getArgument(0));

        AskQuestionResponse result = researchService.askQuestion(request, userId);

        assertNotNull(result);
        assertEquals("The paper introduces a novel optimization...", result.getAnswer());
        verify(questionRepository, times(1)).save(any(ResearchQuestion.class));
        verify(answerRepository, times(1)).save(any(ResearchAnswer.class));
    }

    @Test
    @DisplayName("Should retrieve history of research questions and answers")
    void testGetHistory() {
        UUID qId = UUID.randomUUID();
        ResearchQuestion q = ResearchQuestion.builder()
                .id(qId)
                .userId(userId)
                .question("What is the transformer architecture?")
                .createdAt(LocalDateTime.now())
                .build();

        ResearchAnswer a = ResearchAnswer.builder()
                .id(UUID.randomUUID())
                .questionId(qId)
                .answer("Transformers use multi-head self-attention.")
                .createdAt(LocalDateTime.now())
                .build();

        when(questionRepository.findByUserIdOrderByCreatedAtDesc(userId))
                .thenReturn(List.of(q));
        when(answerRepository.findByQuestionId(qId))
                .thenReturn(Optional.of(a));

        List<ResearchHistoryItemResponse> history = researchService.getHistory(userId);

        assertEquals(1, history.size());
        assertEquals("What is the transformer architecture?", history.get(0).getQuestion());
        assertEquals("Transformers use multi-head self-attention.", history.get(0).getAnswer());
    }
}
