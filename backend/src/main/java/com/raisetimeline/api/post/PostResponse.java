package com.raisetimeline.api.post;

import com.raisetimeline.api.storage.PresignedUrlSerializer;
import java.time.LocalDateTime;
import tools.jackson.databind.annotation.JsonSerialize;

public record PostResponse(
        Long id,
        Long userId,
        String displayName,
        @JsonSerialize(using = PresignedUrlSerializer.class) String avatarUrl,
        String content,
        @JsonSerialize(using = PresignedUrlSerializer.class) String imageUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        long likeCount,
        boolean likedByMe,
        long commentCount
) {
}
