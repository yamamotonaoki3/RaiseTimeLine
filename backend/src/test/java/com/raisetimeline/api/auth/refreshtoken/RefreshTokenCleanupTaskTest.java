package com.raisetimeline.api.auth.refreshtoken;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RefreshTokenCleanupTaskTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private RefreshTokenCleanupTask cleanupTask;

    @Test
    @DisplayName("deleteExpiredTokens: リポジトリの削除が呼ばれる")
    void deleteExpiredTokens_callsRepository() {
        when(refreshTokenRepository.deleteExpired(any(LocalDateTime.class))).thenReturn(3);

        cleanupTask.deleteExpiredTokens();

        verify(refreshTokenRepository).deleteExpired(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("deleteExpiredTokens: 削除に失敗しても例外を伝播させない")
    void deleteExpiredTokens_onFailure_doesNotPropagate() {
        // 例外を投げると以降このスケジュールが実行されなくなるため、握って続行する。
        when(refreshTokenRepository.deleteExpired(any(LocalDateTime.class)))
                .thenThrow(new RuntimeException("DB接続に失敗しました"));

        assertThatCode(() -> cleanupTask.deleteExpiredTokens()).doesNotThrowAnyException();
    }
}
