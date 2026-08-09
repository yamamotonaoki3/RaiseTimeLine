package com.raisetimeline.api.user;

import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {

    Optional<User> findByEmail(String email);

    Optional<User> findByDisplayName(String displayName);

    Optional<User> findById(Long id);

    Optional<User> findByUsername(String username);

    void insert(User user);

    void update(@Param("id") Long id, @Param("displayName") String displayName,
                @Param("bio") String bio, @Param("avatarKey") String avatarKey);

    List<User> search(@Param("keyword") String keyword, @Param("yomiKeyword") String yomiKeyword,
                      @Param("myId") Long myId, @Param("size") int size, @Param("offset") int offset);

    /** アバター移行用。指定の接頭辞で始まる avatar_key を持つユーザーを取得する。 */
    List<User> findByAvatarKeyPrefix(@Param("prefix") String prefix);

    /**
     * アバター移行用。avatar_key だけを更新する。
     * update() は null をガードして無視するため、null クリアには使えない。
     */
    void updateAvatarKey(@Param("id") Long id, @Param("avatarKey") String avatarKey);
}
