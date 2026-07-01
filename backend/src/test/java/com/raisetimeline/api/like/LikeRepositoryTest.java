package com.raisetimeline.api.like;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import com.raisetimeline.api.post.Post;
import com.raisetimeline.api.post.PostRepository;
import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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
class LikeRepositoryTest {

    @Autowired
    private LikeRepository likeRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User userA;
    private Post post1;
    private Post post2;

    @BeforeEach
    void setUp() {
        userA = createUser("like-user-a@example.com", "like_user_a", "いいねユーザーA");
        User userB = createUser("like-user-b@example.com", "like_user_b", "いいねユーザーB");

        post1 = insertPost(userA, "投稿1");
        post2 = insertPost(userA, "投稿2");
    }

    // --- insert() の重複処理（ON CONFLICT DO NOTHING）---

    @Test
    @DisplayName("insert: 初回 INSERT は成功する（有効クラス）")
    void insert_firstTime_success() {
        assertThatCode(() -> likeRepository.insert(post1.getId(), userA.getId()))
                .doesNotThrowAnyException();

        assertThat(likeRepository.exists(post1.getId(), userA.getId())).isTrue();
    }

    @Test
    @DisplayName("insert: 同じ (postId, userId) を再 INSERT しても例外にならない（ON CONFLICT DO NOTHING）")
    void insert_duplicate_doesNotThrow() {
        likeRepository.insert(post1.getId(), userA.getId());

        assertThatCode(() -> likeRepository.insert(post1.getId(), userA.getId()))
                .doesNotThrowAnyException();

        assertThat(likeRepository.exists(post1.getId(), userA.getId())).isTrue();
    }

    // --- countByPostIds() のデシジョンテーブル ---

    @Test
    @DisplayName("countByPostIds: いいねが 0 件の投稿 → カウント 0")
    void countByPostIds_noLikes_returnsZero() {
        List<PostCount> result = likeRepository.countByPostIds(List.of(post1.getId()));

        Map<Long, Long> counts = result.stream()
                .collect(Collectors.toMap(PostCount::getPostId, PostCount::getCnt));
        assertThat(counts.getOrDefault(post1.getId(), 0L)).isEqualTo(0L);
    }

    @Test
    @DisplayName("countByPostIds: いいねが 3 件の投稿 → カウント 3")
    void countByPostIds_threeLikes_returnsThree() {
        User u1 = createUser("liker1@example.com", "liker1", "ライカー1");
        User u2 = createUser("liker2@example.com", "liker2", "ライカー2");
        User u3 = createUser("liker3@example.com", "liker3", "ライカー3");

        likeRepository.insert(post1.getId(), u1.getId());
        likeRepository.insert(post1.getId(), u2.getId());
        likeRepository.insert(post1.getId(), u3.getId());

        List<PostCount> result = likeRepository.countByPostIds(List.of(post1.getId()));

        Map<Long, Long> counts = result.stream()
                .collect(Collectors.toMap(PostCount::getPostId, PostCount::getCnt));
        assertThat(counts.get(post1.getId())).isEqualTo(3L);
    }

    @Test
    @DisplayName("countByPostIds: 複数の投稿でカウントが独立している")
    void countByPostIds_multiplePosts_countedIndependently() {
        User liker = createUser("liker-multi@example.com", "liker_multi", "マルチライカー");
        likeRepository.insert(post2.getId(), liker.getId());

        List<PostCount> result = likeRepository.countByPostIds(List.of(post1.getId(), post2.getId()));

        Map<Long, Long> counts = result.stream()
                .collect(Collectors.toMap(PostCount::getPostId, PostCount::getCnt));
        assertThat(counts.getOrDefault(post1.getId(), 0L)).isEqualTo(0L);
        assertThat(counts.get(post2.getId())).isEqualTo(1L);
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
