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
                @Param("bio") String bio, @Param("avatarUrl") String avatarUrl);

    List<User> search(@Param("keyword") String keyword, @Param("yomiKeyword") String yomiKeyword,
                      @Param("myId") Long myId, @Param("size") int size, @Param("offset") int offset);
}
