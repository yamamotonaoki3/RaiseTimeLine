package com.raisetimeline.api.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentRequest(
        @NotBlank(message = "コメント内容は必須です")
        @Size(max = 280, message = "コメントは280文字以内で入力してください")
        String content
) {
}
