package com.raisetimeline.api.post;

import java.time.LocalDateTime;

public record PostRow(
        Long id,
        Long userId,
        String displayName,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
