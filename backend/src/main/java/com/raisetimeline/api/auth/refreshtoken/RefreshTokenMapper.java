package com.raisetimeline.api.auth.refreshtoken;

import java.time.LocalDateTime;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RefreshTokenMapper {

    void insert(RefreshToken refreshToken);

    Optional<RefreshToken> findByToken(String token);

    /**
     * トークンを使用済みにし、置き換え先を記録する。
     *
     * <p>未使用（used_at IS NULL）の行だけを更新する。同時に同じトークンで
     * 2つのリクエストが来ても、更新できるのは片方だけになる。
     *
     * @return 更新された行数。0 なら既に他のリクエストが使用済みにしている
     */
    int markUsed(
            @Param("token") String token,
            @Param("replacedBy") String replacedBy,
            @Param("usedAt") LocalDateTime usedAt);

    /**
     * 有効期限が切れた行を削除する。
     *
     * <p><b>使用済み（used_at が入っている）というだけの行は消さない。</b>
     * 使用済みの行は、再利用検知が「このトークンは既に使われた」と判断するための証拠であり、
     * 早く消すと盗まれたトークンが使われても「存在しないトークン」として扱われ、
     * 全セッションの失効が発動しなくなる。
     *
     * @return 削除した行数
     */
    int deleteExpired(@Param("now") LocalDateTime now);

    void deleteByToken(String token);

    void deleteByUserId(Long userId);
}
