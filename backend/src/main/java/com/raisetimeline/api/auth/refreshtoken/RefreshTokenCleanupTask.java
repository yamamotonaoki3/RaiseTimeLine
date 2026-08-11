package com.raisetimeline.api.auth.refreshtoken;

import java.time.LocalDateTime;
import net.logstash.logback.argument.StructuredArguments;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 期限切れのリフレッシュトークンを定期的に削除する。
 *
 * <p>トークンの行は、そのトークンが実際に検証されたときにしか消えない。
 * 利用者がブラウザを閉じて放置すると、有効期限を過ぎても誰にも検証されず残り続ける。
 * さらにローテーションでは古いトークンを削除せず使用済みとして残すため、放置すると単調増加する。
 *
 * <p><b>削除するのは有効期限切れの行だけ</b>で、使用済みというだけの行は消さない。
 * 使用済みの行は再利用検知の証拠であり、消すと盗まれたトークンが使われても
 * 全セッションの失効が発動しなくなる（詳細は {@link RefreshTokenService} を参照）。
 */
@Component
public class RefreshTokenCleanupTask {

    private static final Logger LOG = LoggerFactory.getLogger(RefreshTokenCleanupTask.class);

    private final RefreshTokenRepository refreshTokenRepository;

    public RefreshTokenCleanupTask(RefreshTokenRepository refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Scheduled(cron = "${app.cleanup.refresh-tokens.cron}")
    public void deleteExpiredTokens() {
        try {
            int deleted = refreshTokenRepository.deleteExpired(LocalDateTime.now());
            LOG.info(
                    "refresh_token_cleanup",
                    StructuredArguments.kv("deleted_count", deleted));
        } catch (RuntimeException e) {
            // ここで例外を投げると、以降このスケジュールが二度と実行されなくなる。
            // 握るのは実行を止めないためであり、原因が追えるようERRORログは必ず残す。
            LOG.error("refresh_token_cleanup_failed", e);
        }
    }
}
