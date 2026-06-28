package com.raisetimeline.api.auth;

public record RefreshResponse(
        String accessToken,
        Long userId,
        String displayName,
        String email,
        String avatarUrl
) {
}
