package com.raisetimeline.api.comment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.raisetimeline.api.exception.CommentNotFoundException;
import com.raisetimeline.api.exception.ForbiddenException;
import com.raisetimeline.api.exception.PostNotFoundException;
import com.raisetimeline.api.post.PostRepository;
import com.raisetimeline.api.post.PostRow;
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
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;
    @Mock
    private PostRepository postRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CommentService commentService;

    private User owner;
    private User other;
    private CommentResponse ownedComment;
    private PostRow dummyPost;

    @BeforeEach
    void setUp() {
        dummyPost = new PostRow(100L, 1L, "オーナー", null, "投稿内容", null,
                LocalDateTime.now(), LocalDateTime.now());
        owner = new User();
        owner.setId(1L);
        owner.setEmail("owner@example.com");
        owner.setDisplayName("オーナー");

        other = new User();
        other.setId(2L);
        other.setEmail("other@example.com");
        other.setDisplayName("他人");

        ownedComment = new CommentResponse(10L, 100L, 1L, "オーナー", "コメント",
                LocalDateTime.now(), LocalDateTime.now());
    }

    // --- getByPostId() ---

    @Test
    @DisplayName("getByPostId: 投稿が存在する場合はコメント一覧を返す")
    void getByPostId_postExists_returnsComments() {
        when(postRepository.findById(100L)).thenReturn(Optional.of(dummyPost));
        when(commentRepository.findByPostId(100L)).thenReturn(List.of(ownedComment));

        List<CommentResponse> result = commentService.getByPostId(100L);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("getByPostId: 投稿が存在しない場合は PostNotFoundException がスローされる")
    void getByPostId_postNotFound_throwsException() {
        when(postRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.getByPostId(999L))
                .isInstanceOf(PostNotFoundException.class);
    }

    // --- create() ---

    @Test
    @DisplayName("create: 投稿が存在する場合はコメントが作成される")
    void create_postExists_insertsComment() {
        when(postRepository.findById(100L)).thenReturn(Optional.of(dummyPost));
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));
        when(commentRepository.findById(any())).thenReturn(Optional.of(ownedComment));

        CommentResponse result = commentService.create(100L, owner.getEmail(), "コメント");

        assertThat(result).isEqualTo(ownedComment);
        verify(commentRepository).insert(any(Comment.class));
    }

    @Test
    @DisplayName("create: 投稿が存在しない場合は PostNotFoundException がスローされる")
    void create_postNotFound_throwsException() {
        when(postRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.create(999L, owner.getEmail(), "コメント"))
                .isInstanceOf(PostNotFoundException.class);

        verify(commentRepository, never()).insert(any());
    }

    // --- delete() の権限チェック分岐 ---

    @Test
    @DisplayName("delete: 本人のコメントは削除できる")
    void delete_ownComment_deletesSuccessfully() {
        when(commentRepository.findById(10L)).thenReturn(Optional.of(ownedComment));
        when(userRepository.findByEmail(owner.getEmail())).thenReturn(Optional.of(owner));

        commentService.delete(100L, 10L, owner.getEmail());

        verify(commentRepository).delete(10L);
    }

    @Test
    @DisplayName("delete: 他人のコメントを削除しようとすると ForbiddenException がスローされる")
    void delete_otherUserComment_throwsForbidden() {
        when(commentRepository.findById(10L)).thenReturn(Optional.of(ownedComment));
        when(userRepository.findByEmail(other.getEmail())).thenReturn(Optional.of(other));

        assertThatThrownBy(() -> commentService.delete(100L, 10L, other.getEmail()))
                .isInstanceOf(ForbiddenException.class);

        verify(commentRepository, never()).delete(anyLong());
    }

    @Test
    @DisplayName("delete: コメントが存在しない場合は CommentNotFoundException がスローされる")
    void delete_commentNotFound_throwsException() {
        when(commentRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.delete(100L, 999L, owner.getEmail()))
                .isInstanceOf(CommentNotFoundException.class);
    }

    @Test
    @DisplayName("delete: postId が一致しない場合は CommentNotFoundException がスローされる")
    void delete_postIdMismatch_throwsException() {
        when(commentRepository.findById(10L)).thenReturn(Optional.of(ownedComment));

        assertThatThrownBy(() -> commentService.delete(999L, 10L, owner.getEmail()))
                .isInstanceOf(CommentNotFoundException.class);

        verify(commentRepository, never()).delete(anyLong());
    }
}
