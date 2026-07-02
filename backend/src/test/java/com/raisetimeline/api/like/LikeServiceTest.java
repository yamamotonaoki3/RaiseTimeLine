package com.raisetimeline.api.like;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.raisetimeline.api.exception.PostNotFoundException;
import com.raisetimeline.api.post.PostRepository;
import com.raisetimeline.api.post.PostRow;
import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserRepository;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LikeServiceTest {

    @Mock
    private LikeRepository likeRepository;
    @Mock
    private PostRepository postRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private LikeService likeService;

    private User user;
    private PostRow post;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(1L);
        user.setEmail("liker@example.com");

        post = new PostRow(100L, 2L, "投稿者", null, "内容", null,
                LocalDateTime.now(), LocalDateTime.now());
    }

    // --- like() ---

    @Test
    @DisplayName("like: 投稿が存在する場合はいいねが登録される")
    void like_postExists_insertsLike() {
        when(postRepository.findById(100L)).thenReturn(Optional.of(post));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        likeService.like(100L, user.getEmail());

        verify(likeRepository).insert(100L, 1L);
    }

    @Test
    @DisplayName("like: 投稿が存在しない場合は PostNotFoundException がスローされる")
    void like_postNotFound_throwsException() {
        when(postRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> likeService.like(999L, user.getEmail()))
                .isInstanceOf(PostNotFoundException.class);

        verify(likeRepository, never()).insert(anyLong(), anyLong());
    }

    // --- unlike() ---

    @Test
    @DisplayName("unlike: 投稿が存在する場合はいいねが削除される")
    void unlike_postExists_deletesLike() {
        when(postRepository.findById(100L)).thenReturn(Optional.of(post));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        likeService.unlike(100L, user.getEmail());

        verify(likeRepository).delete(100L, 1L);
    }

    @Test
    @DisplayName("unlike: 投稿が存在しない場合は PostNotFoundException がスローされる")
    void unlike_postNotFound_throwsException() {
        when(postRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> likeService.unlike(999L, user.getEmail()))
                .isInstanceOf(PostNotFoundException.class);

        verify(likeRepository, never()).delete(anyLong(), anyLong());
    }
}
