package com.raisetimeline.api.auth;

public record AuthResponse(
        String token,
        Long userId,
        String displayName,
        String email
) {
}
