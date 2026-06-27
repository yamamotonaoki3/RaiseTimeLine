package com.raisetimeline.api.user;

import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper {

    Optional<User> findByEmail(String email);

    Optional<User> findByDisplayName(String displayName);

    Optional<User> findById(Long id);

    Optional<User> findByUsername(String username);

    void insert(User user);
}
