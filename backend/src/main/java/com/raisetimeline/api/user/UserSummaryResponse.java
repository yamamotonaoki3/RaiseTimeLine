package com.raisetimeline.api.user;

public record UserSummaryResponse(
        Long id,
        String displayName,
        String avatarUrl,
        String bio,
        boolean followedByMe
) {}
