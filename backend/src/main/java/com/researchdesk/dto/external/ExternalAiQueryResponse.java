package com.researchdesk.dto.external;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExternalAiQueryResponse {
    private String answer;
    @Builder.Default
    private List<ExternalSourceItem> sources = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExternalSourceItem {
        private UUID documentId;
        private Integer page;
        private String chunkId;
        private String snippet;
    }
}
