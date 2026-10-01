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
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DocumentServiceImpl implements DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentServiceImpl.class);

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final ResearchQuestionRepository researchQuestionRepository;
    private final BlobStorageService blobStorageService;
    private final AiService aiService;

    @Value("${app.document.max-file-size-bytes:52428800}") // Default 50MB
    private long maxFileSizeBytes;

    public DocumentServiceImpl(
            DocumentRepository documentRepository,
            DocumentChunkRepository documentChunkRepository,
            ResearchQuestionRepository researchQuestionRepository,
            BlobStorageService blobStorageService,
            AiService aiService) {
        this.documentRepository = documentRepository;
        this.documentChunkRepository = documentChunkRepository;
        this.researchQuestionRepository = researchQuestionRepository;
        this.blobStorageService = blobStorageService;
        this.aiService = aiService;
    }

    @Override
    @Transactional
    public UploadDocumentResponse uploadDocument(MultipartFile file, UUID userId) {
        validateFile(file);

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "unnamed.pdf";
        }
        originalFilename = originalFilename.trim();

        UUID documentId = UUID.randomUUID();
        String safeName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        String blobName = documentId + "-" + safeName;

        Integer pageCount = extractPageCount(file);

        Document doc = Document.builder()
                .id(documentId)
                .userId(userId)
                .fileName(originalFilename)
                .blobName(blobName)
                .fileSize(file.getSize())
                .fileType("application/pdf")
                .status(DocumentStatus.PROCESSING)
                .pageCount(pageCount)
                .uploadedAt(LocalDateTime.now())
                .build();

        doc = documentRepository.save(doc);

        try {
            // Upload to Azure / Local Blob Storage
            blobStorageService.upload(file, blobName);

            // Index via AI service using the EXACT persisted document ID
            log.info("[DOCUMENT_UPLOAD_INDEXING_START] documentId={}, blobName={}", doc.getId(), blobName);
            boolean indexed = aiService.indexDocument(doc.getId(), blobName);
            log.info("[DOCUMENT_UPLOAD_INDEXING_RESULT] documentId={}, indexed={}", doc.getId(), indexed);

            doc.setStatus(DocumentStatus.READY);
            doc.setProcessedAt(LocalDateTime.now());
            doc = documentRepository.save(doc);
            log.info("Document successfully uploaded and indexed: {} (ID: {})", originalFilename, doc.getId());

        } catch (Exception ex) {
            log.error("Failed to process document upload: {}", ex.getMessage());
            doc.setStatus(DocumentStatus.FAILED);
            documentRepository.save(doc);
            throw ex;
        }

        return UploadDocumentResponse.builder()
                .id(doc.getId())
                .fileName(doc.getFileName())
                .status(doc.getStatus().name())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocuments(UUID userId) {
        return documentRepository.findByUserIdOrderByUploadedAtDesc(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public DocumentResponse getDocument(UUID id, UUID userId) {
        Document doc = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new DocumentNotFoundException(id));
        return mapToResponse(doc);
    }

    @Override
    @Transactional
    public void deleteDocument(UUID id, UUID userId) {
        Document doc = documentRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new DocumentNotFoundException(id));

        try {
            blobStorageService.delete(doc.getBlobName());
        } catch (Exception e) {
            log.warn("Non-fatal: failed to delete blob {} from storage: {}", doc.getBlobName(), e.getMessage());
        }

        try {
            aiService.deleteDocumentIndex(id);
        } catch (Exception e) {
            log.warn("Non-fatal: failed to remove document {} from AI index: {}", id, e.getMessage());
        }

        documentChunkRepository.deleteByDocumentId(id);
        documentRepository.delete(doc);
        log.info("Deleted document and associated metadata: {} (ID: {})", doc.getFileName(), id);
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(UUID userId) {
        long total = documentRepository.countByUserId(userId);
        long ready = documentRepository.countByUserIdAndStatus(userId, DocumentStatus.READY);
        long processing = documentRepository.countByUserIdAndStatus(userId, DocumentStatus.PROCESSING);
        long questions = researchQuestionRepository.countByUserId(userId);

        return DashboardStatsResponse.builder()
                .totalDocuments(total)
                .readyDocuments(ready)
                .processingDocuments(processing)
                .questionsAsked(questions)
                .build();
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidFileTypeException("File is required and cannot be empty.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            throw new InvalidFileTypeException("Only PDF files are supported.");
        }

        String contentType = file.getContentType();
        if (contentType != null && !contentType.equalsIgnoreCase("application/pdf")
                && !contentType.equalsIgnoreCase("application/octet-stream")
                && !contentType.equalsIgnoreCase("application/x-pdf")) {
            throw new InvalidFileTypeException("Invalid file content type: " + contentType + ". Only PDF is supported.");
        }

        if (file.getSize() > maxFileSizeBytes) {
            throw new FileTooLargeException(String.format("File size (%d bytes) exceeds the maximum limit of %d bytes.",
                    file.getSize(), maxFileSizeBytes));
        }
    }

    private Integer extractPageCount(MultipartFile file) {
        try {
            byte[] bytes = file.getBytes();
            try (PDDocument document = Loader.loadPDF(bytes)) {
                return document.getNumberOfPages();
            }
        } catch (Exception e) {
            log.warn("Could not read PDF page count from file (using 1 as fallback): {}", e.getMessage());
            return 1;
        }
    }

    private DocumentResponse mapToResponse(Document doc) {
        return DocumentResponse.builder()
                .id(doc.getId())
                .fileName(doc.getFileName())
                .status(doc.getStatus().name())
                .fileSize(doc.getFileSize())
                .pageCount(doc.getPageCount())
                .uploadedAt(doc.getUploadedAt())
                .processedAt(doc.getProcessedAt())
                .build();
    }
}
