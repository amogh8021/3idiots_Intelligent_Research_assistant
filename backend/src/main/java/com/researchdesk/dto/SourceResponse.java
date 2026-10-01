package com.researchdesk.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SourceResponse {
    private UUID documentId;
    private String fileName;
    private Integer page;
    private String snippet;
}
