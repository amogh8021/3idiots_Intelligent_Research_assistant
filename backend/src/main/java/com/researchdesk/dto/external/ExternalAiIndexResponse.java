package com.researchdesk.dto.external;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalAiIndexResponse {
    private UUID documentId;
    private String status;
    private Integer totalPages;
    private Integer totalChunks;
    private String message;
}
