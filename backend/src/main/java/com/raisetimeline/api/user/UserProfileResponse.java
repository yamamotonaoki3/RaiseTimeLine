package com.raisetimeline.api.user;

import com.raisetimeline.api.storage.PresignedUrlSerializer;
import tools.jackson.databind.annotation.JsonSerialize;

public record UserProfileResponse(
        Long id,
        String displayName,
        @JsonSerialize(using = PresignedUrlSerializer.class) String avatarUrl,
        String bio,
        long followerCount,
        long followingCount,
        long postCount,
        boolean followedByMe
) {}
