package com.researchdesk.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResearchHistoryItemResponse {
    private UUID questionId;
    private String question;
    private String answer;
    private LocalDateTime createdAt;
    private List<UUID> documentIds;
    private List<String> documentNames;
    private List<SourceResponse> sources;
}
