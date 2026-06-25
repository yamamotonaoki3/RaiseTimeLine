package com.raisetimeline.api.user;

import java.util.Optional;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface UserMapper {

    @Select("SELECT * FROM users WHERE email = #{email}")
    Optional<User> findByEmail(String email);

    @Select("SELECT * FROM users WHERE display_name = #{displayName}")
    Optional<User> findByDisplayName(String displayName);

    @Select("SELECT * FROM users WHERE id = #{id}")
    Optional<User> findById(Long id);

    @Select("SELECT * FROM users WHERE username = #{username}")
    Optional<User> findByUsername(String username);

    @Insert("INSERT INTO users (email, password_hash, username, display_name, bio, created_at) "
            + "VALUES (#{email}, #{passwordHash}, #{username}, #{displayName}, #{bio}, NOW())")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(User user);
}
