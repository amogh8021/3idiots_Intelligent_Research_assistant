package com.researchdesk.controller;

import com.researchdesk.dto.DashboardStatsResponse;
import com.researchdesk.dto.DocumentResponse;
import com.researchdesk.dto.UploadDocumentResponse;
import com.researchdesk.config.UserContextResolver;
import com.researchdesk.service.DocumentService;
import com.researchdesk.service.SeedService;
import com.researchdesk.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private static final Logger log = LoggerFactory.getLogger(DocumentController.class);

    private final DocumentService documentService;
    private final UserContextResolver userContextResolver;
    private final SeedService seedService;

    public DocumentController(
            DocumentService documentService,
            UserContextResolver userContextResolver,
            SeedService seedService) {
        this.documentService = documentService;
        this.userContextResolver = userContextResolver;
        this.seedService = seedService;
    }

    private UUID resolveUserId(String authHeader, UUID headerUserId) {
        return userContextResolver.resolveUserId(authHeader, headerUserId);
    }

    @PostMapping("/seed-samples")
    public ResponseEntity<List<DocumentResponse>> seedSamples(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {
        UUID userId = resolveUserId(authHeader, headerUserId);
        seedService.seedSamplePapersForUser(userId);
        List<DocumentResponse> documents = documentService.getDocuments(userId);
        return ResponseEntity.ok(documents);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UploadDocumentResponse> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {
        UUID userId = resolveUserId(authHeader, headerUserId);
        log.info("Received document upload request for user {}: {}", userId, file.getOriginalFilename());
        UploadDocumentResponse response = documentService.uploadDocument(file, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<DocumentResponse>> getDocuments(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {
        UUID userId = resolveUserId(authHeader, headerUserId);
        List<DocumentResponse> documents = documentService.getDocuments(userId);
        return ResponseEntity.ok(documents);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getDocument(
            @PathVariable("id") UUID id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {
        UUID userId = resolveUserId(authHeader, headerUserId);
        DocumentResponse document = documentService.getDocument(id, userId);
        return ResponseEntity.ok(document);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable("id") UUID id,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {
        UUID userId = resolveUserId(authHeader, headerUserId);
        documentService.deleteDocument(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestHeader(value = "X-User-Id", required = false) UUID headerUserId) {
        UUID userId = resolveUserId(authHeader, headerUserId);
        DashboardStatsResponse stats = documentService.getDashboardStats(userId);
        return ResponseEntity.ok(stats);
    }
}
