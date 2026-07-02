package com.raisetimeline.api.follow;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.raisetimeline.api.exception.AlreadyFollowingException;
import com.raisetimeline.api.exception.NotFollowingException;
import com.raisetimeline.api.exception.SelfFollowException;
import com.raisetimeline.api.exception.UserNotFoundException;
import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserRepository;
import com.raisetimeline.api.user.UserSummaryResponse;
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
class FollowServiceTest {

    @Mock
    private FollowRepository followRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FollowService followService;

    private User me;
    private User target;

    @BeforeEach
    void setUp() {
        me = new User();
        me.setId(1L);
        me.setEmail("me@example.com");
        me.setDisplayName("自分");

        target = new User();
        target.setId(2L);
        target.setEmail("target@example.com");
        target.setDisplayName("相手");
    }

    // --- follow() ---

    @Test
    @DisplayName("follow: 未フォローの相手をフォローできる")
    void follow_notYetFollowing_insertsFollow() {
        when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(followRepository.exists(1L, 2L)).thenReturn(false);

        followService.follow(2L, me.getEmail());

        verify(followRepository).insert(1L, 2L);
    }

    @Test
    @DisplayName("follow: 自分自身をフォローしようとすると SelfFollowException がスローされる")
    void follow_self_throwsSelfFollowException() {
        when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));

        assertThatThrownBy(() -> followService.follow(1L, me.getEmail()))
                .isInstanceOf(SelfFollowException.class);

        verify(followRepository, never()).insert(anyLong(), anyLong());
    }

    @Test
    @DisplayName("follow: 対象ユーザーが存在しない場合は UserNotFoundException がスローされる")
    void follow_targetNotFound_throwsException() {
        when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> followService.follow(999L, me.getEmail()))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    @DisplayName("follow: 既にフォロー済みの場合は AlreadyFollowingException がスローされる")
    void follow_alreadyFollowing_throwsException() {
        when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(followRepository.exists(1L, 2L)).thenReturn(true);

        assertThatThrownBy(() -> followService.follow(2L, me.getEmail()))
                .isInstanceOf(AlreadyFollowingException.class);

        verify(followRepository, never()).insert(anyLong(), anyLong());
    }

    // --- unfollow() ---

    @Test
    @DisplayName("unfollow: フォロー中の相手はフォロー解除できる")
    void unfollow_isFollowing_deletesFollow() {
        when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(followRepository.exists(1L, 2L)).thenReturn(true);

        followService.unfollow(2L, me.getEmail());

        verify(followRepository).delete(1L, 2L);
    }

    @Test
    @DisplayName("unfollow: フォローしていない相手を解除しようとすると NotFollowingException がスローされる")
    void unfollow_notFollowing_throwsException() {
        when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(followRepository.exists(1L, 2L)).thenReturn(false);

        assertThatThrownBy(() -> followService.unfollow(2L, me.getEmail()))
                .isInstanceOf(NotFollowingException.class);

        verify(followRepository, never()).delete(anyLong(), anyLong());
    }

    // --- getFollowers() / getFollowing() ---

    @Test
    @DisplayName("getFollowers: フォロワー一覧が followedByMe 付きで返る")
    void getFollowers_returnsSummaryWithFollowedByMe() {
        when(userRepository.findById(2L)).thenReturn(Optional.of(target));
        when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
        when(followRepository.findFollowers(2L)).thenReturn(List.of(me));

        List<UserSummaryResponse> result = followService.getFollowers(2L, me.getEmail());

        assertThat(result).hasSize(1);
        assertThat(result.get(0).followedByMe()).isFalse();
    }

    @Test
    @DisplayName("getFollowing: 対象ユーザーが存在しない場合は UserNotFoundException がスローされる")
    void getFollowing_targetNotFound_throwsException() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> followService.getFollowing(999L, me.getEmail()))
                .isInstanceOf(UserNotFoundException.class);
    }
}
