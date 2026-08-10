package com.raisetimeline.api.auth;

import com.raisetimeline.api.storage.PresignedUrlSerializer;
import tools.jackson.databind.annotation.JsonSerialize;

public record AuthResponse(
        String accessToken,
        Long userId,
        String displayName,
        String email,
        @JsonSerialize(using = PresignedUrlSerializer.class) String avatarUrl
) {
}
