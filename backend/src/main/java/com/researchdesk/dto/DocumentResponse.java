package com.researchdesk.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private UUID id;
    private String fileName;
    private String status;
    private Long fileSize;
    private Integer pageCount;
    private LocalDateTime uploadedAt;
    private LocalDateTime processedAt;
}
