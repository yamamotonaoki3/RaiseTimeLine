package com.raisetimeline.api.auth.refreshtoken;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.raisetimeline.api.exception.InvalidRefreshTokenException;
import com.raisetimeline.api.exception.RefreshTokenReuseDetectedException;
import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * リフレッシュトークンのローテーション判定のテスト。
 *
 * <p>ここが「複数タブの正常な同時アクセス」と「盗まれたトークンの再利用」を分ける中心なので、
 * 状態ごとの分岐をすべて網羅する。
 */
@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    private static final long REFRESH_EXPIRATION_MS = 604800000L;
    private static final long GRACE_SECONDS = 30L;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private UserRepository userRepository;

    private RefreshTokenService refreshTokenService;

    private User user;

    @BeforeEach
    void setUp() {
        refreshTokenService = new RefreshTokenService(
                refreshTokenRepository, userRepository, REFRESH_EXPIRATION_MS, GRACE_SECONDS);

        user = new User();
        user.setId(1L);
        user.setEmail("token-test-user@example.com");
        user.setDisplayName("トークンテスト太郎");
    }

    /** 未使用・有効期限内のトークンを作る。 */
    private RefreshToken unusedToken(String token) {
        RefreshToken t = new RefreshToken();
        t.setUserId(user.getId());
        t.setToken(token);
        t.setExpiresAt(LocalDateTime.now().plusDays(7));
        return t;
    }

    /** 使用済みトークンを作る。usedAt を指定して猶予内／猶予超過を作り分ける。 */
    private RefreshToken usedToken(String token, String replacedBy, LocalDateTime usedAt) {
        RefreshToken t = unusedToken(token);
        t.setUsedAt(usedAt);
        t.setReplacedBy(replacedBy);
        return t;
    }

    @Test
    @DisplayName("rotate: 未使用のトークンなら、新しいトークンを発行して返す")
    void rotate_unusedToken_issuesNewToken() {
        when(refreshTokenRepository.findByToken("t1")).thenReturn(Optional.of(unusedToken("t1")));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(refreshTokenRepository.markUsed(eq("t1"), anyString(), any())).thenReturn(1);

        RotationResult result = refreshTokenService.rotate("t1");

        assertThat(result.user()).isEqualTo(user);
        assertThat(result.newlyIssued()).isTrue();
        assertThat(result.refreshToken()).isNotEqualTo("t1");
        verify(refreshTokenRepository).insert(any(RefreshToken.class));
    }

    @Test
    @DisplayName("rotate: 猶予期間内の再提示なら、新規発行せず同じ置き換え先を返す")
    void rotate_usedWithinGrace_returnsSameReplacement() {
        // 複数タブが同時に開いたときの2番目以降のリクエスト
        RefreshToken used = usedToken("t1", "t2", LocalDateTime.now().minusSeconds(5));
        when(refreshTokenRepository.findByToken("t1")).thenReturn(Optional.of(used));
        when(refreshTokenRepository.findByToken("t2")).thenReturn(Optional.of(unusedToken("t2")));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        RotationResult result = refreshTokenService.rotate("t1");

        assertThat(result.refreshToken()).isEqualTo("t2");
        assertThat(result.newlyIssued()).isFalse();
        // 新規発行していないこと。ここで発行すると、タブごとに別トークンが生まれて破綻する。
        verify(refreshTokenRepository, never()).insert(any(RefreshToken.class));
        // 正常な同時アクセスなので、他のセッションを失効させてはいけない
        verify(refreshTokenRepository, never()).deleteByUserId(any());
    }

    @Test
    @DisplayName("rotate: 猶予期間を過ぎた再提示は盗用とみなし、全セッションを失効させる")
    void rotate_usedAfterGrace_revokesAllSessions() {
        RefreshToken used = usedToken("t1", "t2", LocalDateTime.now().minusSeconds(GRACE_SECONDS + 5));
        when(refreshTokenRepository.findByToken("t1")).thenReturn(Optional.of(used));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> refreshTokenService.rotate("t1"))
                .isInstanceOf(RefreshTokenReuseDetectedException.class);

        verify(refreshTokenRepository).deleteByUserId(user.getId());
    }

    @Test
    @DisplayName("rotate: 猶予期間内なら、置き換えの連鎖をたどって先端のトークンを返す")
    void rotate_withinGrace_followsChainToTip() {
        // 短時間に何度もページ遷移すると T1→T2→T3 と進む。
        // その後に T1 を積んだ遅れたリクエストが届いても、正常な利用として扱う。
        RefreshToken used1 = usedToken("t1", "t2", LocalDateTime.now().minusSeconds(5));
        RefreshToken used2 = usedToken("t2", "t3", LocalDateTime.now().minusSeconds(3));
        when(refreshTokenRepository.findByToken("t1")).thenReturn(Optional.of(used1));
        when(refreshTokenRepository.findByToken("t2")).thenReturn(Optional.of(used2));
        when(refreshTokenRepository.findByToken("t3")).thenReturn(Optional.of(unusedToken("t3")));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        RotationResult result = refreshTokenService.rotate("t1");

        assertThat(result.refreshToken()).isEqualTo("t3");
        assertThat(result.newlyIssued()).isFalse();
        verify(refreshTokenRepository, never()).deleteByUserId(any());
    }

    @Test
    @DisplayName("rotate: 猶予期間内でも連鎖が途切れていれば401。ただし全セッションは失効させない")
    void rotate_brokenChain_throwsWithoutRevoking() {
        // ログアウト等で連鎖の途中が削除されたケース。盗用と断定できない。
        RefreshToken used = usedToken("t1", "t2", LocalDateTime.now().minusSeconds(5));
        when(refreshTokenRepository.findByToken("t1")).thenReturn(Optional.of(used));
        when(refreshTokenRepository.findByToken("t2")).thenReturn(Optional.empty());
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> refreshTokenService.rotate("t1"))
                .isInstanceOf(InvalidRefreshTokenException.class)
                .isNotInstanceOf(RefreshTokenReuseDetectedException.class);

        verify(refreshTokenRepository, never()).deleteByUserId(any());
    }

    @Test
    @DisplayName("rotate: 期限切れは401だが、全セッションの失効は起きない")
    void rotate_expiredToken_doesNotRevokeAllSessions() {
        RefreshToken expired = unusedToken("t1");
        expired.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(refreshTokenRepository.findByToken("t1")).thenReturn(Optional.of(expired));

        assertThatThrownBy(() -> refreshTokenService.rotate("t1"))
                .isInstanceOf(InvalidRefreshTokenException.class)
                .isNotInstanceOf(RefreshTokenReuseDetectedException.class);

        verify(refreshTokenRepository).deleteByToken("t1");
        // 正常な期限切れを盗用扱いして全デバイスからログアウトさせてはいけない
        verify(refreshTokenRepository, never()).deleteByUserId(any());
    }

    @Test
    @DisplayName("rotate: 存在しないトークンは401")
    void rotate_unknownToken_throws() {
        when(refreshTokenRepository.findByToken("unknown")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> refreshTokenService.rotate("unknown"))
                .isInstanceOf(InvalidRefreshTokenException.class);

        verify(refreshTokenRepository, never()).deleteByUserId(any());
    }

    @Test
    @DisplayName("rotate: 使用済みにする更新が競合で0件なら、先に発行された置き換え先を返す")
    void rotate_markUsedLostRace_returnsWinnersToken() {
        // 2つのリクエストがどちらも「未使用」と読んだ後、更新で片方が負けるケース
        when(refreshTokenRepository.findByToken("t1"))
                .thenReturn(Optional.of(unusedToken("t1")))
                .thenReturn(Optional.of(
                        usedToken("t1", "t2", LocalDateTime.now().minusSeconds(1))));
        when(refreshTokenRepository.findByToken("t2")).thenReturn(Optional.of(unusedToken("t2")));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(refreshTokenRepository.markUsed(eq("t1"), anyString(), any())).thenReturn(0);

        RotationResult result = refreshTokenService.rotate("t1");

        assertThat(result.refreshToken()).isEqualTo("t2");
        assertThat(result.newlyIssued()).isFalse();
        // 自分が先に作った行は誰からも参照されないため、後始末として削除される
        verify(refreshTokenRepository).deleteByToken(anyString());
    }

    @Test
    @DisplayName("rotate: 置き換え先の行を作ってから使用済みにする（隙間を作らない）")
    void rotate_insertsReplacementBeforeMarkingUsed() {
        when(refreshTokenRepository.findByToken("t1")).thenReturn(Optional.of(unusedToken("t1")));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(refreshTokenRepository.markUsed(eq("t1"), anyString(), any())).thenReturn(1);

        refreshTokenService.rotate("t1");

        // 逆順だと、replaced_by を記録してから行ができるまでの隙間に届いたリクエストが
        // 「連鎖が途切れている」と誤判定して401になる
        InOrder inOrder = inOrder(refreshTokenRepository);
        inOrder.verify(refreshTokenRepository).insert(any(RefreshToken.class));
        inOrder.verify(refreshTokenRepository).markUsed(eq("t1"), anyString(), any());
    }
}
