package com.raisetimeline.api.post;

import java.time.LocalDateTime;

public record PostRow(
        Long id,
        Long userId,
        String displayName,
        String avatarKey,
        String content,
        String imageKey,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
