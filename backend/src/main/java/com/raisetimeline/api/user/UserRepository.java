package com.raisetimeline.api.user;

import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class UserRepository {

    private final UserMapper userMapper;

    public UserRepository(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public Optional<User> findByEmail(String email) {
        return userMapper.findByEmail(email);
    }

    public Optional<User> findByDisplayName(String displayName) {
        return userMapper.findByDisplayName(displayName);
    }

    public Optional<User> findById(Long id) {
        return userMapper.findById(id);
    }

    public Optional<User> findByUsername(String username) {
        return userMapper.findByUsername(username);
    }

    public void insert(User user) {
        userMapper.insert(user);
    }

    public void update(Long id, String displayName, String bio, String avatarUrl) {
        userMapper.update(id, displayName, bio, avatarUrl);
    }
}
