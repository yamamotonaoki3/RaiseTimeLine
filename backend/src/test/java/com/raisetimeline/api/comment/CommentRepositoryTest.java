package com.raisetimeline.api.comment;

import static org.assertj.core.api.Assertions.assertThat;

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
class CommentRepositoryTest {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User user;
    private Post post;

    @BeforeEach
    void setUp() {
        user = createUser("comment-user@example.com", "comment_user", "コメントユーザー");
        post = insertPost(user, "投稿1");
    }

    // --- insert / findById ---

    @Test
    @DisplayName("insert: コメントを作成すると findById で取得できる")
    void insert_thenFindById_returnsComment() {
        Comment comment = new Comment();
        comment.setPostId(post.getId());
        comment.setUserId(user.getId());
        comment.setContent("コメント本文");
        commentRepository.insert(comment);

        CommentResponse found = commentRepository.findById(comment.getId()).orElseThrow();

        assertThat(found.content()).isEqualTo("コメント本文");
        assertThat(found.postId()).isEqualTo(post.getId());
        assertThat(found.userId()).isEqualTo(user.getId());
    }

    // --- findByPostId ---

    @Test
    @DisplayName("findByPostId: 投稿に紐づくコメントが 0 件のとき空リストを返す")
    void findByPostId_noComments_returnsEmptyList() {
        List<CommentResponse> result = commentRepository.findByPostId(post.getId());

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findByPostId: 投稿に紐づくコメントが複数件あるとき全件返す")
    void findByPostId_multipleComments_returnsAll() {
        insertComment(post.getId(), user.getId(), "コメント1");
        insertComment(post.getId(), user.getId(), "コメント2");

        List<CommentResponse> result = commentRepository.findByPostId(post.getId());

        assertThat(result).hasSize(2);
    }

    // --- delete ---

    @Test
    @DisplayName("delete: コメントを削除すると findById で取得できなくなる")
    void delete_removesComment() {
        Comment comment = insertComment(post.getId(), user.getId(), "削除対象");

        commentRepository.delete(comment.getId());

        assertThat(commentRepository.findById(comment.getId())).isEmpty();
    }

    // --- countByPostIds ---

    @Test
    @DisplayName("countByPostIds: 複数投稿でコメント数が独立して集計される")
    void countByPostIds_countsIndependently() {
        Post post2 = insertPost(user, "投稿2");
        insertComment(post.getId(), user.getId(), "コメントA");
        insertComment(post.getId(), user.getId(), "コメントB");
        insertComment(post2.getId(), user.getId(), "コメントC");

        var result = commentRepository.countByPostIds(List.of(post.getId(), post2.getId()));

        Map<Long, Long> counts = result.stream()
                .collect(Collectors.toMap(c -> c.getPostId(), c -> c.getCnt()));
        assertThat(counts.get(post.getId())).isEqualTo(2L);
        assertThat(counts.get(post2.getId())).isEqualTo(1L);
    }

    private Comment insertComment(Long postId, Long userId, String content) {
        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setUserId(userId);
        comment.setContent(content);
        commentRepository.insert(comment);
        return comment;
    }

    private User createUser(String email, String username, String displayName) {
        User u = new User();
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode("Pass1234"));
        u.setUsername(username);
        u.setDisplayName(displayName);
        userRepository.insert(u);
        return u;
    }

    private Post insertPost(User user, String content) {
        Post p = new Post();
        p.setUserId(user.getId());
        p.setContent(content);
        postRepository.insert(p);
        return p;
    }
}
