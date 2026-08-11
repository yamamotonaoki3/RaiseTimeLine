package com.raisetimeline.api.auth.refreshtoken;

import com.raisetimeline.api.exception.InvalidRefreshTokenException;
import com.raisetimeline.api.exception.RefreshTokenReuseDetectedException;
import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;
import net.logstash.logback.argument.StructuredArguments;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * リフレッシュトークンの発行とローテーションを担う。
 *
 * <p>ローテーションでは使用済みトークンを<b>削除せず、使用済みとして記録する</b>。
 * 削除してしまうと「複数タブによる正常な同時アクセス」と「盗まれたトークンの再利用」を
 * 区別できず、前者を弾くか後者を見逃すかのどちらかになるため。
 *
 * <p>提示されたトークンの状態ごとの扱いは {@link #rotate(String)} を参照。
 */
@Service
public class RefreshTokenService {

    private static final Logger LOG = LoggerFactory.getLogger(RefreshTokenService.class);

    /** 無効なトークンに対する共通メッセージ。再利用検知かどうかをクライアントに悟らせない。 */
    private static final String INVALID_MESSAGE = "リフレッシュトークンが無効です";

    /** 置き換えの連鎖をたどる上限。想定外のデータで無限ループに陥らないための保険。 */
    private static final int MAX_CHAIN_HOPS = 20;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final long refreshExpiration;
    private final Duration rotationGrace;

    public RefreshTokenService(
            RefreshTokenRepository refreshTokenRepository,
            UserRepository userRepository,
            @Value("${jwt.refresh-expiration}") long refreshExpiration,
            @Value("${jwt.refresh-rotation-grace-seconds}") long rotationGraceSeconds) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.refreshExpiration = refreshExpiration;
        this.rotationGrace = Duration.ofSeconds(rotationGraceSeconds);
    }

    public String create(Long userId) {
        String token = UUID.randomUUID().toString();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(userId);
        refreshToken.setToken(token);
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(refreshExpiration / 1000));
        refreshTokenRepository.insert(refreshToken);
        return token;
    }

    /**
     * リフレッシュトークンをローテーションする。
     *
     * <table>
     *   <caption>提示されたトークンの状態ごとの扱い</caption>
     *   <tr><th>状態</th><th>扱い</th></tr>
     *   <tr><td>見つからない / 期限切れ</td><td>401</td></tr>
     *   <tr><td>未使用</td><td>使用済みにし、新しいトークンを発行する</td></tr>
     *   <tr><td>使用済み・猶予期間内</td>
     *       <td>正常な同時アクセスとみなし、<b>置き換え先の同じトークンを返す</b>（新規発行しない）</td></tr>
     *   <tr><td>使用済み・猶予期間超過</td>
     *       <td>盗用の疑い。<b>そのユーザーの全トークンを失効</b>させて401</td></tr>
     * </table>
     */
    public RotationResult rotate(String token) {
        RefreshToken stored = refreshTokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidRefreshTokenException(INVALID_MESSAGE));

        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            // 正常な期限切れ。盗用ではないので、他のセッションには手を出さない。
            refreshTokenRepository.deleteByToken(token);
            throw new InvalidRefreshTokenException("リフレッシュトークンの有効期限が切れています");
        }

        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> new InvalidRefreshTokenException(INVALID_MESSAGE));

        if (!stored.isUnused()) {
            return handleAlreadyUsed(stored, user);
        }

        // 新しい行を先に作ってから、古いトークンを使用済みにする。
        //
        // 順序が逆だと、used_at と replaced_by を記録してから新しい行ができるまでの間に隙間が生まれ、
        // その隙間に届いた別のリクエストが「置き換え先が存在しない＝連鎖が途切れている」と判断して
        // 401を返してしまう。refreshSession はトランザクション境界を持たない（各SQLが即コミットされる）ため、
        // この順序で隙間そのものを無くす。
        String newToken = UUID.randomUUID().toString();
        RefreshToken issued = new RefreshToken();
        issued.setUserId(user.getId());
        issued.setToken(newToken);
        issued.setExpiresAt(LocalDateTime.now().plusSeconds(refreshExpiration / 1000));
        refreshTokenRepository.insert(issued);

        int updated = refreshTokenRepository.markUsed(token, newToken, LocalDateTime.now());
        if (updated == 0) {
            // ごく短い間に別のリクエストが先に使用済みにした。
            // 自分が作った行は誰からも参照されないため削除し、相手が発行したものを共有する。
            refreshTokenRepository.deleteByToken(newToken);
            RefreshToken reread = refreshTokenRepository.findByToken(token)
                    .orElseThrow(() -> new InvalidRefreshTokenException(INVALID_MESSAGE));
            return handleAlreadyUsed(reread, user);
        }

        return new RotationResult(user, newToken, true);
    }

    /**
     * 既に使用済みのトークンが提示されたときの判定。
     *
     * <p>猶予期間内であれば、複数タブの同時アクセスや、遅れて届いた古いリクエストとみなし、
     * <b>置き換えの連鎖をたどって現在の先端のトークンを返す</b>。新規発行はしない。
     * ここで新しいトークンを発行すると、タブごとに別のトークンが生まれ、
     * Cookieの上書き順によって結局どれかが無効になる。
     *
     * <p>連鎖をたどるのは、短時間に何度もページ遷移すると
     * 「T1→T2→T3」と進んだ後に T1 を積んだリクエストが届きうるため。
     * 置き換え先が使用済みというだけで盗用扱いにすると、正常な利用を弾いてしまう。
     *
     * <p>猶予を過ぎてからの再提示は、盗まれたトークンが使われた疑いとして全セッションを失効させる。
     */
    private RotationResult handleAlreadyUsed(RefreshToken stored, User user) {
        boolean withinGrace = stored.getUsedAt() != null
                && stored.getUsedAt().isAfter(LocalDateTime.now().minus(rotationGrace));

        if (withinGrace) {
            RefreshToken tip = findChainTip(stored);
            if (tip != null) {
                return new RotationResult(user, tip.getToken(), false);
            }
            // 連鎖の途中が失われている（ログアウト等で削除された）。
            // 盗用と断定できないため、全セッションの失効はせず単に無効として扱う。
            throw new InvalidRefreshTokenException(INVALID_MESSAGE);
        }

        refreshTokenRepository.deleteByUserId(user.getId());
        LOG.warn(
                "refresh_token_reuse_detected",
                StructuredArguments.kv("user_id", user.getId()),
                StructuredArguments.kv("action", "all_sessions_revoked"));
        throw new RefreshTokenReuseDetectedException(INVALID_MESSAGE);
    }

    /**
     * 置き換えの連鎖をたどり、まだ使われていない先端のトークンを返す。
     *
     * <p>連鎖が途切れている場合は null。
     * 想定外のデータで無限に辿らないよう、たどる回数に上限を設ける。
     */
    private RefreshToken findChainTip(RefreshToken from) {
        RefreshToken current = from;
        for (int hop = 0; hop < MAX_CHAIN_HOPS; hop++) {
            if (current.isUnused()) {
                return current;
            }
            if (current.getReplacedBy() == null) {
                return null;
            }
            RefreshToken next = refreshTokenRepository.findByToken(current.getReplacedBy())
                    .orElse(null);
            if (next == null) {
                return null;
            }
            current = next;
        }
        return null;
    }

    public void delete(String token) {
        refreshTokenRepository.deleteByToken(token);
    }
}
