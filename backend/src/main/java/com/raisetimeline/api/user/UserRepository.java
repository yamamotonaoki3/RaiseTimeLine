package com.raisetimeline.api.user;

import java.util.List;
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

    public List<User> search(String keyword, Long myId, int page, int size) {
        String stripped = stripSpaces(keyword);
        String yomiKeyword = toHiragana(stripped).toLowerCase();
        return userMapper.search(stripped, yomiKeyword, myId, size, page * size);
    }

    private String stripSpaces(String s) {
        return s.replaceAll("[\\s　]", "");
    }

    private String toHiragana(String s) {
        StringBuilder sb = new StringBuilder(s.length());
        for (char c : s.toCharArray()) {
            if (c >= 'ァ' && c <= 'ヶ') {
                c -= 0x60;
            }
            sb.append(c);
        }
        return sb.toString();
    }
}
