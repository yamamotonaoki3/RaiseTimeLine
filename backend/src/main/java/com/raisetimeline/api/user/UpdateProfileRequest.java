package com.raisetimeline.api.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "表示名は1〜50文字で入力してください")
        @Size(min = 1, max = 50, message = "表示名は1〜50文字で入力してください")
        String displayName,

        @Size(max = 160, message = "自己紹介文は160文字以内で入力してください")
        String bio
) {}
