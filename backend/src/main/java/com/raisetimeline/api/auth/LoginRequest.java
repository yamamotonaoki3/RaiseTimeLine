package com.raisetimeline.api.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "メールアドレスは必須です")
        @Email(message = "正しいメールアドレスを入力してください")
        String email,

        @NotBlank(message = "パスワードは必須です")
        String password
) {
}
