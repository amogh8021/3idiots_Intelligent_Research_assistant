package com.researchdesk.service;

import com.researchdesk.dto.DashboardStatsResponse;
import com.researchdesk.dto.DocumentResponse;
import com.researchdesk.dto.UploadDocumentResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface DocumentService {
    UploadDocumentResponse uploadDocument(MultipartFile file, UUID userId);
    List<DocumentResponse> getDocuments(UUID userId);
    DocumentResponse getDocument(UUID id, UUID userId);
    void deleteDocument(UUID id, UUID userId);
    DashboardStatsResponse getDashboardStats(UUID userId);
}
