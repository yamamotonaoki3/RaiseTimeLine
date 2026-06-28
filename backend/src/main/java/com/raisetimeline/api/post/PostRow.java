package com.raisetimeline.api.post;

import java.time.LocalDateTime;

public record PostRow(
        Long id,
        Long userId,
        String displayName,
        String avatarUrl,
        String content,
        String imageUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
