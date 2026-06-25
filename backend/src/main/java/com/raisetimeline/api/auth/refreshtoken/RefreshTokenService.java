package com.raisetimeline.api.auth.refreshtoken;

import com.raisetimeline.api.exception.InvalidRefreshTokenException;
import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserMapper;
import java.time.LocalDateTime;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class RefreshTokenService {

    private final RefreshTokenMapper refreshTokenMapper;
    private final UserMapper userMapper;
    private final long refreshExpiration;

    public RefreshTokenService(
            RefreshTokenMapper refreshTokenMapper,
            UserMapper userMapper,
            @Value("${jwt.refresh-expiration}") long refreshExpiration) {
        this.refreshTokenMapper = refreshTokenMapper;
        this.userMapper = userMapper;
        this.refreshExpiration = refreshExpiration;
    }

    public String create(Long userId) {
        String token = UUID.randomUUID().toString();
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(userId);
        refreshToken.setToken(token);
        refreshToken.setExpiresAt(LocalDateTime.now().plusSeconds(refreshExpiration / 1000));
        refreshTokenMapper.insert(refreshToken);
        return token;
    }

    public User validate(String token) {
        RefreshToken refreshToken = refreshTokenMapper.findByToken(token)
                .orElseThrow(() -> new InvalidRefreshTokenException("リフレッシュトークンが無効です"));

        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenMapper.deleteByToken(token);
            throw new InvalidRefreshTokenException("リフレッシュトークンの有効期限が切れています");
        }

        return userMapper.findById(refreshToken.getUserId())
                .orElseThrow(() -> new InvalidRefreshTokenException("ユーザーが見つかりません"));
    }

    public void delete(String token) {
        refreshTokenMapper.deleteByToken(token);
    }
}
