package com.raisetimeline.api.user;

public record UserProfileResponse(
        Long id,
        String displayName,
        String avatarUrl,
        String bio,
        long followerCount,
        long followingCount,
        long postCount,
        boolean followedByMe
) {}
