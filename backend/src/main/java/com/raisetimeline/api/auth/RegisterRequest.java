package com.raisetimeline.api.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "メールアドレスは必須です")
        @Email(message = "正しいメールアドレスを入力してください")
        String email,

        @NotBlank(message = "ユーザー名は必須です")
        @Size(min = 3, max = 50, message = "ユーザー名は3〜50文字で入力してください")
        @Pattern(
                regexp = "^[a-zA-Z0-9_]+$",
                message = "ユーザー名は英数字とアンダースコアのみ使用できます"
        )
        String username,

        @NotBlank(message = "表示名は必須です")
        @Size(max = 50, message = "表示名は50文字以内で入力してください")
        String displayName,

        @NotBlank(message = "パスワードは必須です")
        @Size(min = 8, max = 64, message = "パスワードは8〜64文字で入力してください")
        @Pattern(
                regexp = "^(?=.*[a-zA-Z])(?=.*[0-9]).+$",
                message = "パスワードは英字と数字を両方含めてください"
        )
        String password
) {
}
