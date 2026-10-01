package com.researchdesk.service;

import com.researchdesk.dto.DashboardStatsResponse;
import com.researchdesk.dto.DocumentResponse;
import com.researchdesk.dto.UploadDocumentResponse;
import com.researchdesk.entity.Document;
import com.researchdesk.entity.DocumentStatus;
import com.researchdesk.exception.DocumentNotFoundException;
import com.researchdesk.exception.FileTooLargeException;
import com.researchdesk.exception.InvalidFileTypeException;
import com.researchdesk.repository.DocumentChunkRepository;
import com.researchdesk.repository.DocumentRepository;
import com.researchdesk.repository.ResearchQuestionRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DocumentServiceTest {

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentChunkRepository documentChunkRepository;

    @Mock
    private ResearchQuestionRepository researchQuestionRepository;

    @Mock
    private BlobStorageService blobStorageService;

    @Mock
    private AiService aiService;

    @InjectMocks
    private DocumentServiceImpl documentService;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        ReflectionTestUtils.setField(documentService, "maxFileSizeBytes", 52428800L); // 50MB
    }

    private byte[] createSamplePdf() throws IOException {
        try (PDDocument doc = new PDDocument()) {
            doc.addPage(new PDPage());
            doc.addPage(new PDPage());
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        }
    }

    @Test
    @DisplayName("Should successfully upload a valid PDF document")
    void testUploadValidPdf() throws Exception {
        byte[] pdfBytes = createSamplePdf();
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "quantum_computing.pdf",
                "application/pdf",
                pdfBytes
        );

        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> {
            Document d = invocation.getArgument(0);
            return d;
        });

        UploadDocumentResponse response = documentService.uploadDocument(file, userId);

        assertNotNull(response);
        assertEquals("quantum_computing.pdf", response.getFileName());
        assertEquals(DocumentStatus.READY.name(), response.getStatus());
        verify(blobStorageService, times(1)).upload(eq(file), anyString());
        verify(documentRepository, atLeastOnce()).save(any(Document.class));
    }

    @Test
    @DisplayName("Should reject non-PDF file upload")
    void testRejectNonPdfFile() {
        MockMultipartFile txtFile = new MockMultipartFile(
                "file",
                "notes.txt",
                "text/plain",
                "some content".getBytes()
        );

        assertThrows(InvalidFileTypeException.class, () ->
                documentService.uploadDocument(txtFile, userId)
        );
        verifyNoInteractions(blobStorageService);
    }

    @Test
    @DisplayName("Should reject file exceeding maximum size limit")
    void testRejectFileTooLarge() {
        ReflectionTestUtils.setField(documentService, "maxFileSizeBytes", 100L); // 100 bytes max
        MockMultipartFile largeFile = new MockMultipartFile(
                "file",
                "large.pdf",
                "application/pdf",
                new byte[500]
        );

        assertThrows(FileTooLargeException.class, () ->
                documentService.uploadDocument(largeFile, userId)
        );
    }

    @Test
    @DisplayName("Should retrieve list of documents for a user")
    void testGetDocuments() {
        Document doc1 = Document.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .fileName("doc1.pdf")
                .status(DocumentStatus.READY)
                .fileSize(1024L)
                .pageCount(5)
                .uploadedAt(LocalDateTime.now())
                .build();

        when(documentRepository.findByUserIdOrderByUploadedAtDesc(userId))
                .thenReturn(List.of(doc1));

        List<DocumentResponse> result = documentService.getDocuments(userId);

        assertEquals(1, result.size());
        assertEquals("doc1.pdf", result.get(0).getFileName());
        assertEquals(5, result.get(0).getPageCount());
    }

    @Test
    @DisplayName("Should delete document and blob storage record")
    void testDeleteDocument() {
        UUID docId = UUID.randomUUID();
        Document doc = Document.builder()
                .id(docId)
                .userId(userId)
                .fileName("to_delete.pdf")
                .blobName("blob-to-delete")
                .status(DocumentStatus.READY)
                .build();

        when(documentRepository.findByIdAndUserId(docId, userId)).thenReturn(Optional.of(doc));

        documentService.deleteDocument(docId, userId);

        verify(blobStorageService, times(1)).delete("blob-to-delete");
        verify(documentChunkRepository, times(1)).deleteByDocumentId(docId);
        verify(documentRepository, times(1)).delete(doc);
    }

    @Test
    @DisplayName("Should throw DocumentNotFoundException on delete when missing")
    void testDeleteDocumentNotFound() {
        UUID docId = UUID.randomUUID();
        when(documentRepository.findByIdAndUserId(docId, userId)).thenReturn(Optional.empty());

        assertThrows(DocumentNotFoundException.class, () ->
                documentService.deleteDocument(docId, userId)
        );
    }

    @Test
    @DisplayName("Should calculate dashboard stats accurately")
    void testGetDashboardStats() {
        when(documentRepository.countByUserId(userId)).thenReturn(10L);
        when(documentRepository.countByUserIdAndStatus(userId, DocumentStatus.READY)).thenReturn(8L);
        when(documentRepository.countByUserIdAndStatus(userId, DocumentStatus.PROCESSING)).thenReturn(2L);
        when(researchQuestionRepository.countByUserId(userId)).thenReturn(5L);

        DashboardStatsResponse stats = documentService.getDashboardStats(userId);

        assertEquals(10L, stats.getTotalDocuments());
        assertEquals(8L, stats.getReadyDocuments());
        assertEquals(2L, stats.getProcessingDocuments());
        assertEquals(5L, stats.getQuestionsAsked());
    }
}
