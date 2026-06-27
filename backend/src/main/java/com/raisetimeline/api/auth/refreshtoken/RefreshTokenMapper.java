package com.raisetimeline.api.auth.refreshtoken;

import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface RefreshTokenMapper {

    void insert(RefreshToken refreshToken);

    Optional<RefreshToken> findByToken(String token);

    void deleteByToken(String token);

    void deleteByUserId(Long userId);
}
