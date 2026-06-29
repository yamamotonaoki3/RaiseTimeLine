package com.raisetimeline.api.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "認証", description = "ユーザー登録・ログイン・ログアウト・トークン管理")
public class AuthController {

    private static final String REFRESH_TOKEN_COOKIE = "refreshToken";
    private static final int REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @Operation(summary = "ユーザー登録", description = "新規ユーザーを登録し、アクセストークンを返却します")
    public ResponseEntity<AuthResponse> register(
            @RequestBody @Valid RegisterRequest request,
            HttpServletResponse response) {
        TokenPair pair = authService.register(request);
        setRefreshTokenCookie(response, pair.refreshToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(pair.authResponse());
    }

    @PostMapping("/login")
    @Operation(summary = "ログイン", description = "メールアドレスとパスワードで認証し、アクセストークンを返却します")
    public ResponseEntity<AuthResponse> login(
            @RequestBody @Valid LoginRequest request,
            HttpServletResponse response) {
        TokenPair pair = authService.login(request);
        setRefreshTokenCookie(response, pair.refreshToken());
        return ResponseEntity.ok(pair.authResponse());
    }

    @PostMapping("/refresh")
    @Operation(summary = "トークン更新", description = "Cookie のリフレッシュトークンを使用して新しいアクセストークンを取得します")
    public ResponseEntity<RefreshResponse> refresh(
            HttpServletRequest request,
            HttpServletResponse response) {
        String refreshToken = extractRefreshTokenFromCookie(request);
        RefreshResult result = authService.refreshSession(refreshToken);
        setRefreshTokenCookie(response, result.newRefreshToken());
        return ResponseEntity.ok(result.response());
    }

    @PostMapping("/logout")
    @Operation(summary = "ログアウト", description = "リフレッシュトークンを無効化してセッションを終了します")
    public ResponseEntity<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response) {
        String refreshToken = extractRefreshTokenFromCookie(request);
        authService.logout(refreshToken);
        clearRefreshTokenCookie(response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @Operation(summary = "ログインユーザー情報取得", description = "現在ログイン中のユーザー情報を返却します")
    @SecurityRequirement(name = "bearer-jwt")
    public ResponseEntity<MeResponse> getCurrentUser(Authentication authentication) {
        return authService.getCurrentUser(authentication.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, token);
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(REFRESH_TOKEN_MAX_AGE);
        response.addCookie(cookie);
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (REFRESH_TOKEN_COOKIE.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
