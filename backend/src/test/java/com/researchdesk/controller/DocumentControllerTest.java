package com.researchdesk.controller;

import com.researchdesk.dto.DashboardStatsResponse;
import com.researchdesk.dto.DocumentResponse;
import com.researchdesk.dto.UploadDocumentResponse;
import com.researchdesk.exception.DocumentNotFoundException;
import com.researchdesk.exception.GlobalExceptionHandler;
import com.researchdesk.exception.InvalidFileTypeException;
import com.researchdesk.config.UserContextResolver;
import com.researchdesk.service.DocumentService;
import com.researchdesk.service.SeedService;
import com.researchdesk.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class DocumentControllerTest {

    private MockMvc mockMvc;

    @Mock
    private DocumentService documentService;

    @Mock
    private UserContextResolver userContextResolver;

    @Mock
    private SeedService seedService;

    @InjectMocks
    private DocumentController documentController;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        lenient().when(userContextResolver.resolveUserId(any(), any())).thenReturn(userId);
        mockMvc = MockMvcBuilders.standaloneSetup(documentController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/documents - Success")
    void testUploadDocumentSuccess() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                "%PDF-1.4 dummy".getBytes()
        );

        UploadDocumentResponse response = UploadDocumentResponse.builder()
                .id(UUID.randomUUID())
                .fileName("test.pdf")
                .status("READY")
                .build();

        when(documentService.uploadDocument(any(), eq(userId))).thenReturn(response);

        mockMvc.perform(multipart("/api/documents").file(file))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.fileName").value("test.pdf"))
                .andExpect(jsonPath("$.status").value("READY"));
    }

    @Test
    @DisplayName("GET /api/documents - Returns list")
    void testGetDocuments() throws Exception {
        DocumentResponse doc = DocumentResponse.builder()
                .id(UUID.randomUUID())
                .fileName("paper.pdf")
                .status("READY")
                .fileSize(1024L)
                .uploadedAt(LocalDateTime.now())
                .build();

        when(documentService.getDocuments(userId)).thenReturn(List.of(doc));

        mockMvc.perform(get("/api/documents"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].fileName").value("paper.pdf"));
    }

    @Test
    @DisplayName("GET /api/documents/{id} - 404 when not found")
    void testGetDocumentNotFound() throws Exception {
        UUID docId = UUID.randomUUID();
        when(documentService.getDocument(docId, userId)).thenThrow(new DocumentNotFoundException(docId));

        mockMvc.perform(get("/api/documents/" + docId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("DOCUMENT_NOT_FOUND"));
    }

    @Test
    @DisplayName("DELETE /api/documents/{id} - 204 No Content")
    void testDeleteDocument() throws Exception {
        UUID docId = UUID.randomUUID();
        doNothing().when(documentService).deleteDocument(docId, userId);

        mockMvc.perform(delete("/api/documents/" + docId))
                .andExpect(status().isNoContent());

        verify(documentService, times(1)).deleteDocument(docId, userId);
    }

    @Test
    @DisplayName("GET /api/documents/stats - Returns dashboard stats")
    void testGetDashboardStats() throws Exception {
        DashboardStatsResponse stats = DashboardStatsResponse.builder()
                .totalDocuments(5)
                .readyDocuments(4)
                .processingDocuments(1)
                .questionsAsked(12)
                .build();

        when(documentService.getDashboardStats(userId)).thenReturn(stats);

        mockMvc.perform(get("/api/documents/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDocuments").value(5))
                .andExpect(jsonPath("$.questionsAsked").value(12));
    }
}
