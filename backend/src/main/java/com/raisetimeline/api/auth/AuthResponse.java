package com.raisetimeline.api.auth;

public record AuthResponse(
        String accessToken,
        Long userId,
        String displayName,
        String email
) {
}
