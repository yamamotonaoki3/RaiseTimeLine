package com.raisetimeline.api.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PostRequest(
        @NotBlank(message = "投稿内容は必須です")
        @Size(max = 280, message = "投稿は280文字以内で入力してください")
        String content
) {
}
