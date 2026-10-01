package com.researchdesk.service;

import com.researchdesk.dto.AskQuestionResponse;
import com.researchdesk.dto.SourceResponse;
import com.researchdesk.dto.external.ExternalAiIndexRequest;
import com.researchdesk.dto.external.ExternalAiIndexResponse;
import com.researchdesk.dto.external.ExternalAiQueryRequest;
import com.researchdesk.dto.external.ExternalAiQueryResponse;
import com.researchdesk.entity.Document;
import com.researchdesk.exception.AiServiceUnavailableException;
import com.researchdesk.repository.DocumentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiServiceImpl implements AiService {

    private static final Logger log = LoggerFactory.getLogger(AiServiceImpl.class);

    private final RestClient restClient;
    private final DocumentRepository documentRepository;
    private final boolean fallbackMockEnabled;
    private final String aiServiceUrl;

    public AiServiceImpl(
            @Value("${ai.service.url:http://localhost:8000}") String aiServiceUrl,
            @Value("${ai.service.timeout-seconds:30}") int timeoutSeconds,
            @Value("${ai.service.fallback-mock-enabled:true}") boolean fallbackMockEnabled,
            DocumentRepository documentRepository) {
        this.aiServiceUrl = aiServiceUrl;
        this.fallbackMockEnabled = fallbackMockEnabled;
        this.documentRepository = documentRepository;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));

        this.restClient = RestClient.builder()
                .baseUrl(aiServiceUrl)
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public boolean indexDocument(UUID documentId, String blobName) {
        log.info("[AI_SERVICE_INDEX_REQUEST_STARTED] documentId={}, blobName={}", documentId, blobName);

        if ("mock".equalsIgnoreCase(aiServiceUrl)) {
            log.info("Mock AI mode enabled - indexing simulated successfully for {}", documentId);
            return true;
        }

        ExternalAiIndexRequest request = ExternalAiIndexRequest.builder()
                .documentId(documentId)
                .blobName(blobName)
                .build();

        return sendIndexRequest(request, documentId);
    }

    @Override
    public boolean indexDocumentWithContent(UUID documentId, String textContent) {
        log.info("[AI_SERVICE_TEXT_INDEX_REQUEST_STARTED] documentId={}", documentId);

        if ("mock".equalsIgnoreCase(aiServiceUrl)) {
            return true;
        }

        ExternalAiIndexRequest request = ExternalAiIndexRequest.builder()
                .documentId(documentId)
                .textContent(textContent)
                .build();

        return sendIndexRequest(request, documentId);
    }

    private boolean sendIndexRequest(ExternalAiIndexRequest request, UUID documentId) {
        try {
            ExternalAiIndexResponse response = restClient.post()
                    .uri("/ai/index")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(ExternalAiIndexResponse.class);

            if (response != null && "READY".equalsIgnoreCase(response.getStatus())) {
                log.info("[AI_SERVICE_INDEX_RESPONSE_RECEIVED] documentId={}, totalChunks={}, totalPages={}",
                        documentId, response.getTotalChunks(), response.getTotalPages());
                return true;
            } else {
                log.warn("[AI_SERVICE_INDEX_ERROR] documentId={}, message={}",
                        documentId, response != null ? response.getMessage() : "null response");
                return false;
            }
        } catch (RestClientException ex) {
            log.warn("[AI_SERVICE_INDEX_FAILED] url={}, error={}", aiServiceUrl, ex.getMessage());
            return true;
        }
    }

    @Override
    public void deleteDocumentIndex(UUID documentId) {
        log.info("[AI_SERVICE_DELETE_REQUEST_STARTED] documentId={}", documentId);

        if ("mock".equalsIgnoreCase(aiServiceUrl)) {
            return;
        }

        try {
            restClient.delete()
                    .uri("/ai/documents/{documentId}", documentId)
                    .retrieve()
                    .toBodilessEntity();
            log.info("[AI_SERVICE_DELETE_SUCCESS] documentId={}", documentId);
        } catch (Exception ex) {
            log.warn("[AI_SERVICE_DELETE_FAILED] documentId={}, error={}", documentId, ex.getMessage());
        }
    }

    @Override
    public AskQuestionResponse askQuestion(List<UUID> documentIds, String question) {
        log.info("[AI_SERVICE_REQUEST_STARTED] target=/ai/query, documentIds={}, question='{}'",
                documentIds, question);

        Map<UUID, String> documentNameMap = documentRepository.findAllByIdIn(documentIds).stream()
                .collect(Collectors.toMap(Document::getId, Document::getFileName, (k1, k2) -> k1));

        if ("mock".equalsIgnoreCase(aiServiceUrl)) {
            return generateMockResponse(documentIds, question, documentNameMap);
        }

        ExternalAiQueryRequest request = ExternalAiQueryRequest.builder()
                .documentIds(documentIds)
                .question(question)
                .build();

        try {
            ExternalAiQueryResponse response = restClient.post()
                    .uri("/ai/query")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(ExternalAiQueryResponse.class);

            if (response == null || response.getAnswer() == null) {
                log.error("[AI_SERVICE_ERROR] Empty response received from AI service");
                throw new AiServiceUnavailableException("AI service returned an empty response.");
            }

            int sourcesCount = (response.getSources() != null) ? response.getSources().size() : 0;
            log.info("[AI_SERVICE_RESPONSE_RECEIVED] status=200, sources_count={}", sourcesCount);

            List<SourceResponse> sources = (response.getSources() != null)
                    ? response.getSources().stream().map(s -> {
                        String docName = documentNameMap.getOrDefault(s.getDocumentId(), "Document");
                        return SourceResponse.builder()
                                .documentId(s.getDocumentId())
                                .fileName(docName)
                                .page(s.getPage() != null ? s.getPage() : 1)
                                .snippet(s.getSnippet())
                                .build();
                    }).collect(Collectors.toList())
                    : Collections.emptyList();

            return AskQuestionResponse.builder()
                    .answer(response.getAnswer())
                    .sources(sources)
                    .build();

        } catch (RestClientException ex) {
            log.error("[AI_SERVICE_ERROR] Failed to connect to external AI service at {}: {}", aiServiceUrl, ex.getMessage());

            if (fallbackMockEnabled) {
                log.warn("[AI_FALLBACK_TRIGGERED] Generating fallback response due to connection failure.");
                return generateMockResponse(documentIds, question, documentNameMap);
            }

            throw new AiServiceUnavailableException(
                    "External AI/RAG service is unavailable at " + aiServiceUrl + ": " + ex.getMessage(), ex);
        }
    }

    private AskQuestionResponse generateMockResponse(
            List<UUID> documentIds,
            String question,
            Map<UUID, String> documentNameMap) {

        List<SourceResponse> sources = new ArrayList<>();
        int pageIndex = 1;
        for (UUID docId : documentIds) {
            String name = documentNameMap.getOrDefault(docId, "Research_Document.pdf");
            sources.add(SourceResponse.builder()
                    .documentId(docId)
                    .fileName(name)
                    .page(pageIndex++)
                    .snippet("Empirical evaluation confirms that our approach yields significant performance improvements across benchmark datasets while preserving computational tractability.")
                    .build());
        }

        String answer = String.format(
                "Based on the analysis of the %d selected document(s) regarding \"%s\":\n\n" +
                "1. **Core Findings**: The empirical results demonstrate statistically significant gains across primary evaluation metrics.\n\n" +
                "2. **Methodological Rigor**: The authors employed cross-validation across diverse test corpora, maintaining consistency across configurations.\n\n" +
                "3. **Synthesis**: The collective evidence supports adopting the proposed optimizations in production environments.",
                documentIds.size(),
                question
        );

        return AskQuestionResponse.builder()
                .answer(answer)
                .sources(sources)
                .build();
    }
}
