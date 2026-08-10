package com.raisetimeline.api.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.raisetimeline.api.auth.refreshtoken.RefreshTokenService;
import com.raisetimeline.api.exception.DuplicateDisplayNameException;
import com.raisetimeline.api.exception.DuplicateEmailException;
import com.raisetimeline.api.exception.DuplicateUsernameException;
import com.raisetimeline.api.security.JwtUtil;
import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtUtil jwtUtil;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private RefreshTokenService refreshTokenService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest validRequest;
    private User existingUser;

    @BeforeEach
    void setUp() {
        validRequest = new RegisterRequest(
                "test@example.com", "test_user", "テストユーザー", "Pass1234", "てすとゆーざー");
        existingUser = new User();
        existingUser.setId(1L);
        existingUser.setEmail("test@example.com");
        existingUser.setDisplayName("テストユーザー");
    }

    // --- register() の分岐網羅 ---

    @Test
    @DisplayName("register: メール重複の場合 DuplicateEmailException がスローされる")
    void register_duplicateEmail_throwsException() {
        when(userRepository.findByEmail(validRequest.email())).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> authService.register(validRequest))
                .isInstanceOf(DuplicateEmailException.class);

        verify(userRepository, never()).insert(any());
    }

    @Test
    @DisplayName("register: ユーザー名重複の場合 DuplicateUsernameException がスローされる")
    void register_duplicateUsername_throwsException() {
        when(userRepository.findByEmail(validRequest.email())).thenReturn(Optional.empty());
        when(userRepository.findByUsername(validRequest.username())).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> authService.register(validRequest))
                .isInstanceOf(DuplicateUsernameException.class);

        verify(userRepository, never()).insert(any());
    }

    @Test
    @DisplayName("register: 表示名重複の場合 DuplicateDisplayNameException がスローされる")
    void register_duplicateDisplayName_throwsException() {
        when(userRepository.findByEmail(validRequest.email())).thenReturn(Optional.empty());
        when(userRepository.findByUsername(validRequest.username())).thenReturn(Optional.empty());
        when(userRepository.findByDisplayName(validRequest.displayName())).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> authService.register(validRequest))
                .isInstanceOf(DuplicateDisplayNameException.class);

        verify(userRepository, never()).insert(any());
    }

    @Test
    @DisplayName("register: 重複なしの場合 TokenPair が返り insert が呼ばれる")
    void register_success_returnsTokenPair() {
        when(userRepository.findByEmail(validRequest.email())).thenReturn(Optional.empty());
        when(userRepository.findByUsername(validRequest.username())).thenReturn(Optional.empty());
        when(userRepository.findByDisplayName(validRequest.displayName())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(validRequest.password())).thenReturn("hashedPassword");
        when(jwtUtil.generateAccessToken(any())).thenReturn("access-token");
        when(refreshTokenService.create(any())).thenReturn("refresh-token");

        TokenPair result = authService.register(validRequest);

        verify(userRepository).insert(any(User.class));
        assertThat(result).isNotNull();
        assertThat(result.authResponse().accessToken()).isEqualTo("access-token");
    }

    // --- login() の分岐網羅 ---

    @Test
    @DisplayName("login: 正常ログインの場合 TokenPair が返る")
    void login_success_returnsTokenPair() {
        LoginRequest loginRequest = new LoginRequest("test@example.com", "Pass1234");
        when(userRepository.findByEmail(loginRequest.email())).thenReturn(Optional.of(existingUser));
        when(jwtUtil.generateAccessToken(existingUser.getEmail())).thenReturn("access-token");
        when(refreshTokenService.create(existingUser.getId())).thenReturn("refresh-token");

        TokenPair result = authService.login(loginRequest);

        assertThat(result).isNotNull();
        assertThat(result.authResponse().accessToken()).isEqualTo("access-token");
    }

    // --- refreshSession() の分岐網羅 ---

    @Test
    @DisplayName("refreshSession: 有効なトークンの場合 RefreshResult が返る")
    void refreshSession_validToken_returnsResult() {
        when(refreshTokenService.validate("valid-token")).thenReturn(existingUser);
        when(refreshTokenService.create(existingUser.getId())).thenReturn("new-refresh-token");
        when(jwtUtil.generateAccessToken(existingUser.getEmail())).thenReturn("new-access-token");

        RefreshResult result = authService.refreshSession("valid-token");

        assertThat(result).isNotNull();
        assertThat(result.newRefreshToken()).isEqualTo("new-refresh-token");
        verify(refreshTokenService).delete("valid-token");
    }

    // --- logout() の分岐網羅 ---

    @Test
    @DisplayName("logout: トークンが null の場合 deleteByToken は呼ばれない")
    void logout_nullToken_doesNotCallDelete() {
        authService.logout(null);

        verify(refreshTokenService, never()).delete(any());
    }

    @Test
    @DisplayName("logout: トークンが存在する場合 deleteByToken が呼ばれる")
    void logout_validToken_callsDelete() {
        authService.logout("some-token");

        verify(refreshTokenService).delete("some-token");
    }
}
