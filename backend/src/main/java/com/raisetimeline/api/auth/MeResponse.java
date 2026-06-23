package com.raisetimeline.api.auth;

public record MeResponse(
        Long userId,
        String displayName,
        String email,
        String avatarUrl,
        String bio
) {
}
