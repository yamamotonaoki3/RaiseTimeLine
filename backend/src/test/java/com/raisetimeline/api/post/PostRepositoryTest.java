package com.raisetimeline.api.post;

import static org.assertj.core.api.Assertions.assertThat;

import com.raisetimeline.api.follow.FollowRepository;
import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class PostRepositoryTest {

    private static final int PAGE_SIZE = 20;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FollowRepository followRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private User userA;
    private User userB;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("DELETE FROM likes");
        jdbcTemplate.execute("DELETE FROM comments");
        jdbcTemplate.execute("DELETE FROM posts");
        userA = createUser("usera@example.com", "user_a", "ユーザーA");
        userB = createUser("userb@example.com", "user_b", "ユーザーB");
    }

    // --- findLatest() の境界値 ---

    @Test
    @DisplayName("findLatest: 投稿 0 件（境界値：最小）→ 空リスト")
    void findLatest_noPosts_returnsEmpty() {
        List<PostRow> result = postRepository.findLatest(PAGE_SIZE);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findLatest: 投稿 1 件（境界値：最小+1）→ 1件返る")
    void findLatest_onePost_returnsOne() {
        insertPost(userA, "投稿1");

        List<PostRow> result = postRepository.findLatest(PAGE_SIZE);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("findLatest: 投稿 20 件（境界値：上限=PAGE_SIZE）→ 20 件返る")
    void findLatest_exactPageSize_returns20() {
        for (int i = 0; i < PAGE_SIZE; i++) {
            insertPost(userA, "投稿" + i);
        }

        List<PostRow> result = postRepository.findLatest(PAGE_SIZE);

        assertThat(result).hasSize(PAGE_SIZE);
    }

    @Test
    @DisplayName("findLatest: 投稿 21 件（境界値：上限+1）→ 20 件のみ返る")
    void findLatest_overPageSize_returnsOnlyPageSize() {
        for (int i = 0; i < PAGE_SIZE + 1; i++) {
            insertPost(userA, "投稿" + i);
        }

        List<PostRow> result = postRepository.findLatest(PAGE_SIZE);

        assertThat(result).hasSize(PAGE_SIZE);
    }

    // --- findBefore(cursor) の同値分割 ---

    @Test
    @DisplayName("findBefore: cursor より小さい ID の投稿は返る（有効クラス）")
    void findBefore_olderPosts_returnsResults() {
        Post post1 = insertPost(userA, "古い投稿");
        Post post2 = insertPost(userA, "新しい投稿");

        List<PostRow> result = postRepository.findBefore(post2.getId(), PAGE_SIZE);

        assertThat(result).anyMatch(r -> r.id().equals(post1.getId()));
    }

    @Test
    @DisplayName("findBefore: cursor より大きい ID の投稿は返らない（無効クラス）")
    void findBefore_newerPosts_notReturned() {
        Post post1 = insertPost(userA, "古い投稿");
        Post post2 = insertPost(userA, "新しい投稿");

        List<PostRow> result = postRepository.findBefore(post1.getId(), PAGE_SIZE);

        assertThat(result).noneMatch(r -> r.id().equals(post2.getId()));
        assertThat(result).noneMatch(r -> r.id().equals(post1.getId()));
    }

    // --- findLatestFollowing() のデシジョンテーブル ---

    @Test
    @DisplayName("findLatestFollowing: フォロー先ユーザーの投稿はヒットする")
    void findLatestFollowing_followeePost_returnsPost() {
        followRepository.insert(userA.getId(), userB.getId());
        Post post = insertPost(userB, "フォロー先の投稿");

        List<PostRow> result = postRepository.findLatestFollowing(userA.getId(), PAGE_SIZE);

        assertThat(result).anyMatch(r -> r.id().equals(post.getId()));
    }

    @Test
    @DisplayName("findLatestFollowing: 自分自身の投稿はヒットしない")
    void findLatestFollowing_ownPost_notReturned() {
        Post myPost = insertPost(userA, "自分の投稿");

        List<PostRow> result = postRepository.findLatestFollowing(userA.getId(), PAGE_SIZE);

        assertThat(result).noneMatch(r -> r.id().equals(myPost.getId()));
    }

    @Test
    @DisplayName("findLatestFollowing: 未フォローのユーザーの投稿はヒットしない")
    void findLatestFollowing_unfollowedPost_notReturned() {
        Post otherPost = insertPost(userB, "未フォローユーザーの投稿");

        List<PostRow> result = postRepository.findLatestFollowing(userA.getId(), PAGE_SIZE);

        assertThat(result).noneMatch(r -> r.id().equals(otherPost.getId()));
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

    private Post insertPost(User user, String content) {
        Post post = new Post();
        post.setUserId(user.getId());
        post.setContent(content);
        postRepository.insert(post);
        return post;
    }
}
