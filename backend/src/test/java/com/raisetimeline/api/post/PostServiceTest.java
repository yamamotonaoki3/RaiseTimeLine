package com.raisetimeline.api.post;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.raisetimeline.api.comment.CommentRepository;
import com.raisetimeline.api.exception.ForbiddenException;
import com.raisetimeline.api.like.LikeRepository;
import com.raisetimeline.api.like.PostCount;
import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock
    private PostRepository postRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private LikeRepository likeRepository;
    @Mock
    private CommentRepository commentRepository;
    @Mock
    private S3PostImageService s3PostImageService;

    @InjectMocks
    private PostService postService;

    private User owner;
    private User other;
    private PostRow postWithImage;
    private PostRow postWithoutImage;

    @BeforeEach
    void setUp() {
        owner = new User();
        owner.setId(1L);
        owner.setEmail("owner@example.com");
        owner.setDisplayName("オーナー");

        other = new User();
        other.setId(2L);
        other.setEmail("other@example.com");
        other.setDisplayName("他人");

        postWithImage = new PostRow(100L, 1L, "オーナー", null, "内容", "https://s3/image.jpg",
                LocalDateTime.now(), LocalDateTime.now());
        postWithoutImage = new PostRow(101L, 1L, "オーナー", null, "内容", null,
                LocalDateTime.now(), LocalDateTime.now());
    }

    private void stubEnrich() {
        when(likeRepository.countByPostIds(anyList())).thenReturn(List.of());
        when(likeRepository.likedPostIdsByUser(anyList(), anyLong())).thenReturn(List.of());
        when(commentRepository.countByPostIds(anyList())).thenReturn(List.of());
    }

    // --- delete() の権限チェック分岐 ---

    @Test
    @DisplayName("delete: 本人の投稿は削除できる（画像あり → S3 delete が呼ばれる）")
    void delete_ownPostWithImage_callsS3Delete() {
        when(postRepository.findById(100L)).thenReturn(Optional.of(postWithImage));
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));

        postService.delete(100L, owner.getEmail());

        verify(s3PostImageService).delete(postWithImage.imageUrl());
        verify(postRepository).delete(100L);
    }

    @Test
    @DisplayName("delete: 本人の投稿は削除できる（画像なし → S3 delete は呼ばれない）")
    void delete_ownPostWithoutImage_doesNotCallS3Delete() {
        when(postRepository.findById(101L)).thenReturn(Optional.of(postWithoutImage));
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));

        postService.delete(101L, owner.getEmail());

        verify(s3PostImageService, never()).delete(any());
        verify(postRepository).delete(101L);
    }

    @Test
    @DisplayName("delete: 他人の投稿を削除しようとすると ForbiddenException がスローされる")
    void delete_otherUserPost_throwsForbidden() {
        when(postRepository.findById(100L)).thenReturn(Optional.of(postWithImage));
        when(userRepository.findByEmail(other.getEmail())).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> postService.delete(100L, other.getEmail()))
                .isInstanceOf(ForbiddenException.class);

        verify(postRepository, never()).delete(anyLong());
    }

    // --- update() の権限チェック分岐 ---

    @Test
    @DisplayName("update: 他人の投稿を更新しようとすると ForbiddenException がスローされる")
    void update_otherUserPost_throwsForbidden() {
        when(postRepository.findById(100L)).thenReturn(Optional.of(postWithImage));
        when(userRepository.findByEmail(other.getEmail())).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> postService.update(100L, other.getEmail(), "更新内容", null, false))
                .isInstanceOf(ForbiddenException.class);

        verify(postRepository, never()).update(anyLong(), any(), any());
    }

    @Test
    @DisplayName("update: 本人が更新する場合 postRepository.update が呼ばれる")
    void update_ownPost_callsRepositoryUpdate() {
        when(postRepository.findById(100L)).thenReturn(Optional.of(postWithImage));
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(postRepository.findById(100L)).thenReturn(Optional.of(postWithImage));
        stubEnrich();

        postService.update(100L, owner.getEmail(), "更新内容", null, false);

        verify(postRepository).update(100L, "更新内容", postWithImage.imageUrl());
    }

    // --- enrich() のデータマッピング確認 ---

    @Test
    @DisplayName("enrich: 複数の投稿で likeCount・commentCount が正しくマッピングされる")
    void enrich_multiplePostsCorrectMapping() {
        PostRow post1 = new PostRow(1L, 1L, "A", null, "c1", null, LocalDateTime.now(), LocalDateTime.now());
        PostRow post2 = new PostRow(2L, 1L, "A", null, "c2", null, LocalDateTime.now(), LocalDateTime.now());
        when(postRepository.findLatest(20)).thenReturn(List.of(post1, post2));
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));

        PostCount like1 = new PostCount();
        like1.setPostId(1L);
        like1.setCnt(3L);
        PostCount like2 = new PostCount();
        like2.setPostId(2L);
        like2.setCnt(5L);
        when(likeRepository.countByPostIds(List.of(1L, 2L))).thenReturn(List.of(like1, like2));
        when(likeRepository.likedPostIdsByUser(anyList(), anyLong())).thenReturn(List.of());

        PostCount comment2 = new PostCount();
        comment2.setPostId(2L);
        comment2.setCnt(2L);
        when(commentRepository.countByPostIds(anyList())).thenReturn(List.of(comment2));

        List<PostResponse> result = postService.getLatest(owner.getEmail());

        assertThat(result).hasSize(2);
        assertThat(result.get(0).likeCount()).isEqualTo(3L);
        assertThat(result.get(0).commentCount()).isEqualTo(0L);
        assertThat(result.get(1).likeCount()).isEqualTo(5L);
        assertThat(result.get(1).commentCount()).isEqualTo(2L);
    }
}
