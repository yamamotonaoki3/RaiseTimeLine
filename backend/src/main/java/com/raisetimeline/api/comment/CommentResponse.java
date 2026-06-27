package com.raisetimeline.api.comment;

import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        Long postId,
        Long userId,
        String displayName,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
