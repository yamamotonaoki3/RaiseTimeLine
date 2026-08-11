package com.raisetimeline.api.auth.refreshtoken;

import static org.assertj.core.api.Assertions.assertThat;

import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserRepository;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * 期限切れリフレッシュトークンの削除（{@code deleteExpired}）のテスト。
 *
 * <p>「何を消すか」だけでなく<b>「何を残すか」</b>が重要なので、そちらも明示的に検証する。
 * とくに使用済みの行は再利用検知の証拠であり、消すと盗用を検知できなくなる。
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class RefreshTokenRepositoryTest {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User user;

    @BeforeEach
    void setUp() {
        user = createUser("cleanup-user@example.com", "cleanup_user", "クリーンアップ検証ユーザー");
    }

    @Test
    @DisplayName("deleteExpired: 期限切れの行は削除される")
    void deleteExpired_removesExpiredRow() {
        insertToken("expired-token", LocalDateTime.now().minusDays(1));

        int deleted = refreshTokenRepository.deleteExpired(LocalDateTime.now());

        assertThat(deleted).isEqualTo(1);
        assertThat(refreshTokenRepository.findByToken("expired-token")).isEmpty();
    }

    @Test
    @DisplayName("deleteExpired: 有効期限内の行は残る")
    void deleteExpired_keepsValidRow() {
        insertToken("valid-token", LocalDateTime.now().plusDays(7));

        refreshTokenRepository.deleteExpired(LocalDateTime.now());

        assertThat(refreshTokenRepository.findByToken("valid-token")).isPresent();
    }

    @Test
    @DisplayName("deleteExpired: 使用済みでも期限内なら残る（再利用検知の証拠を消さない）")
    void deleteExpired_keepsUsedButNotExpiredRow() {
        insertToken("used-token", LocalDateTime.now().plusDays(7));
        insertToken("replacement-token", LocalDateTime.now().plusDays(7));
        refreshTokenRepository.markUsed("used-token", "replacement-token", LocalDateTime.now());

        refreshTokenRepository.deleteExpired(LocalDateTime.now());

        // ここが消えると、盗まれたトークンが再提示されても「存在しないトークン」となり、
        // 全セッションの失効が発動しなくなる
        assertThat(refreshTokenRepository.findByToken("used-token")).isPresent();
    }

    @Test
    @DisplayName("deleteExpired: 期限切れと期限内が混在していても、期限切れだけを消す")
    void deleteExpired_removesOnlyExpired() {
        insertToken("expired-1", LocalDateTime.now().minusDays(2));
        insertToken("expired-2", LocalDateTime.now().minusMinutes(1));
        insertToken("valid-1", LocalDateTime.now().plusDays(1));

        int deleted = refreshTokenRepository.deleteExpired(LocalDateTime.now());

        assertThat(deleted).isEqualTo(2);
        assertThat(refreshTokenRepository.findByToken("expired-1")).isEmpty();
        assertThat(refreshTokenRepository.findByToken("expired-2")).isEmpty();
        assertThat(refreshTokenRepository.findByToken("valid-1")).isPresent();
    }

    @Test
    @DisplayName("deleteExpired: 対象が無ければ0件を返す")
    void deleteExpired_noTarget_returnsZero() {
        insertToken("valid-only", LocalDateTime.now().plusDays(1));

        assertThat(refreshTokenRepository.deleteExpired(LocalDateTime.now())).isZero();
    }

    private void insertToken(String token, LocalDateTime expiresAt) {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(user.getId());
        refreshToken.setToken(token);
        refreshToken.setExpiresAt(expiresAt);
        refreshTokenRepository.insert(refreshToken);
    }

    private User createUser(String email, String username, String displayName) {
        User newUser = new User();
        newUser.setEmail(email);
        newUser.setPasswordHash(passwordEncoder.encode("Pass1234"));
        newUser.setUsername(username);
        newUser.setDisplayName(displayName);
        userRepository.insert(newUser);
        return newUser;
    }
}
