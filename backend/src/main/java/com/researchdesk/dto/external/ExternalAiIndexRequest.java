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
public class ExternalAiIndexRequest {
    private UUID documentId;
    private String blobName;
    private String filePath;
    private String textContent;
}
