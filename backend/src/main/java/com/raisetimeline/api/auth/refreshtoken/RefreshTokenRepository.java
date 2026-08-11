package com.raisetimeline.api.auth.refreshtoken;

import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class RefreshTokenRepository {

    private final RefreshTokenMapper refreshTokenMapper;

    public RefreshTokenRepository(RefreshTokenMapper refreshTokenMapper) {
        this.refreshTokenMapper = refreshTokenMapper;
    }

    public void insert(RefreshToken refreshToken) {
        refreshTokenMapper.insert(refreshToken);
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenMapper.findByToken(token);
    }

    /**
     * トークンを使用済みにする。更新できた件数を返す（0 なら既に使用済みだった）。
     */
    public int markUsed(String token, String replacedBy, LocalDateTime usedAt) {
        return refreshTokenMapper.markUsed(token, replacedBy, usedAt);
    }

    public void deleteByToken(String token) {
        refreshTokenMapper.deleteByToken(token);
    }

    public void deleteByUserId(Long userId) {
        refreshTokenMapper.deleteByUserId(userId);
    }
}
