package com.researchdesk.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AskQuestionResponse {
    private String answer;
    @Builder.Default
    private List<SourceResponse> sources = new ArrayList<>();
}
