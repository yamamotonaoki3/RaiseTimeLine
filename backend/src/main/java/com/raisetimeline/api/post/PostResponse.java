package com.raisetimeline.api.post;

import java.time.LocalDateTime;

public record PostResponse(
        Long id,
        Long userId,
        String displayName,
        String avatarUrl,
        String content,
        String imageUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        long likeCount,
        boolean likedByMe,
        long commentCount
) {
}
