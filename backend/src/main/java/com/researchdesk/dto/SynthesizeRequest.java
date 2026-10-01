package com.researchdesk.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SynthesizeRequest {

    @NotEmpty(message = "At least one document must be selected.")
    private List<UUID> documentIds;

    @Builder.Default
    private String focus = "executive"; // "executive", "methodology", "limitations", "comparison"
}
