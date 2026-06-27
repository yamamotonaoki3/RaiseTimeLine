package com.raisetimeline.api.auth.refreshtoken;

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

    public void deleteByToken(String token) {
        refreshTokenMapper.deleteByToken(token);
    }

    public void deleteByUserId(Long userId) {
        refreshTokenMapper.deleteByUserId(userId);
    }
}
