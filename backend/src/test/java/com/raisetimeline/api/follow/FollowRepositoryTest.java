package com.raisetimeline.api.follow;

import static org.assertj.core.api.Assertions.assertThat;

import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class FollowRepositoryTest {

    @Autowired
    private FollowRepository followRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User follower;
    private User followee;

    @BeforeEach
    void setUp() {
        follower = createUser("follower@example.com", "follower_user", "フォロワー");
        followee = createUser("followee@example.com", "followee_user", "フォロー対象");
    }

    // --- insert / exists ---

    @Test
    @DisplayName("insert: フォローすると exists が true になる")
    void insert_thenExists_returnsTrue() {
        followRepository.insert(follower.getId(), followee.getId());

        assertThat(followRepository.exists(follower.getId(), followee.getId())).isTrue();
    }

    @Test
    @DisplayName("exists: フォローしていない場合は false")
    void exists_notFollowing_returnsFalse() {
        assertThat(followRepository.exists(follower.getId(), followee.getId())).isFalse();
    }

    // --- delete ---

    @Test
    @DisplayName("delete: フォロー解除すると exists が false になる")
    void delete_removesFollow() {
        followRepository.insert(follower.getId(), followee.getId());

        followRepository.delete(follower.getId(), followee.getId());

        assertThat(followRepository.exists(follower.getId(), followee.getId())).isFalse();
    }

    // --- findFollowers / findFollowing ---

    @Test
    @DisplayName("findFollowers: フォロワー一覧を取得できる")
    void findFollowers_returnsFollowerList() {
        followRepository.insert(follower.getId(), followee.getId());

        List<User> result = followRepository.findFollowers(followee.getId());

        assertThat(result).extracting(User::getId).containsExactly(follower.getId());
    }

    @Test
    @DisplayName("findFollowing: フォロー中一覧を取得できる")
    void findFollowing_returnsFollowingList() {
        followRepository.insert(follower.getId(), followee.getId());

        List<User> result = followRepository.findFollowing(follower.getId());

        assertThat(result).extracting(User::getId).containsExactly(followee.getId());
    }

    // --- countFollowers / countFollowing ---

    @Test
    @DisplayName("countFollowers: フォロワー数をカウントできる")
    void countFollowers_returnsCount() {
        followRepository.insert(follower.getId(), followee.getId());

        assertThat(followRepository.countFollowers(followee.getId())).isEqualTo(1L);
    }

    @Test
    @DisplayName("countFollowing: フォロー中の数をカウントできる")
    void countFollowing_returnsCount() {
        followRepository.insert(follower.getId(), followee.getId());

        assertThat(followRepository.countFollowing(follower.getId())).isEqualTo(1L);
    }

    private User createUser(String email, String username, String displayName) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("Pass1234"));
        user.setUsername(username);
        user.setDisplayName(displayName);
        userRepository.insert(user);
        return user;
    }
}
