package com.raisetimeline.api.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.raisetimeline.api.exception.ForbiddenException;
import com.raisetimeline.api.follow.FollowRepository;
import com.raisetimeline.api.post.PostRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private FollowRepository followRepository;
    @Mock
    private PostRepository postRepository;
    @Mock
    private AvatarStorageService avatarStorageService;

    @InjectMocks
    private UserService userService;

    private User me;
    private User other;

    @BeforeEach
    void setUp() {
        me = new User();
        me.setId(1L);
        me.setEmail("me@example.com");
        me.setDisplayName("自分");

        other = new User();
        other.setId(2L);
        other.setEmail("other@example.com");
        other.setDisplayName("他人");
    }

    // --- updateProfile() の権限チェック分岐 ---

    @Test
    @DisplayName("updateProfile: 本人のプロフィール更新は実行される")
    void updateProfile_self_callsUpdate() {
        when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
        when(userRepository.findById(me.getId())).thenReturn(Optional.of(me));
        when(followRepository.countFollowers(anyLong())).thenReturn(0L);
        when(followRepository.countFollowing(anyLong())).thenReturn(0L);
        when(postRepository.findByUserId(anyLong())).thenReturn(List.of());

        userService.updateProfile(me.getId(), me.getEmail(), "新しい表示名", "自己紹介", null);

        verify(userRepository).update(me.getId(), "新しい表示名", "自己紹介", null);
    }

    @Test
    @DisplayName("updateProfile: 他人のプロフィール更新は ForbiddenException がスローされる")
    void updateProfile_otherUser_throwsForbidden() {
        when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));

        assertThatThrownBy(
                () -> userService.updateProfile(other.getId(), me.getEmail(), "表示名", null, null))
                .isInstanceOf(ForbiddenException.class);

        verify(userRepository, never()).update(anyLong(), any(), any(), any());
    }

    // --- updateProfile() の avatar 分岐 ---

    @Test
    @DisplayName("updateProfile: avatar が null の場合 AvatarStorageService は呼ばれない")
    void updateProfile_nullAvatar_doesNotCallStorage() {
        when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
        when(userRepository.findById(me.getId())).thenReturn(Optional.of(me));
        when(followRepository.countFollowers(anyLong())).thenReturn(0L);
        when(followRepository.countFollowing(anyLong())).thenReturn(0L);
        when(postRepository.findByUserId(anyLong())).thenReturn(List.of());

        userService.updateProfile(me.getId(), me.getEmail(), "表示名", null, null);

        verify(avatarStorageService, never()).store(any(), any());
    }

    @Test
    @DisplayName("updateProfile: avatar がある場合 AvatarStorageService が呼ばれる")
    void updateProfile_withAvatar_callsStorage() {
        MultipartFile avatar = mock(MultipartFile.class);
        when(avatar.isEmpty()).thenReturn(false);
        when(avatarStorageService.store(any(), any())).thenReturn("https://s3/avatar.jpg");
        when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
        when(userRepository.findById(me.getId())).thenReturn(Optional.of(me));
        when(followRepository.countFollowers(anyLong())).thenReturn(0L);
        when(followRepository.countFollowing(anyLong())).thenReturn(0L);
        when(postRepository.findByUserId(anyLong())).thenReturn(List.of());

        userService.updateProfile(me.getId(), me.getEmail(), "表示名", null, avatar);

        verify(avatarStorageService).store(avatar, me.getAvatarUrl());
    }

    // --- getProfile() の followedByMe 分岐 ---

    @Test
    @DisplayName("getProfile: フォロー済みの場合 followedByMe が true")
    void getProfile_following_returnsFollowedByMeTrue() {
        when(userRepository.findById(other.getId())).thenReturn(Optional.of(other));
        when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
        when(followRepository.countFollowers(anyLong())).thenReturn(0L);
        when(followRepository.countFollowing(anyLong())).thenReturn(0L);
        when(postRepository.findByUserId(anyLong())).thenReturn(List.of());
        when(followRepository.exists(me.getId(), other.getId())).thenReturn(true);

        UserProfileResponse result = userService.getProfile(other.getId(), me.getEmail());

        assertThat(result.followedByMe()).isTrue();
    }

    @Test
    @DisplayName("getProfile: 未フォローの場合 followedByMe が false")
    void getProfile_notFollowing_returnsFollowedByMeFalse() {
        when(userRepository.findById(other.getId())).thenReturn(Optional.of(other));
        when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
        when(followRepository.countFollowers(anyLong())).thenReturn(0L);
        when(followRepository.countFollowing(anyLong())).thenReturn(0L);
        when(postRepository.findByUserId(anyLong())).thenReturn(List.of());
        when(followRepository.exists(me.getId(), other.getId())).thenReturn(false);

        UserProfileResponse result = userService.getProfile(other.getId(), me.getEmail());

        assertThat(result.followedByMe()).isFalse();
    }

    @Test
    @DisplayName("getProfile: 自分自身のプロフィールでは followedByMe が false（自己フォロー対策）")
    void getProfile_self_followedByMeIsFalse() {
        when(userRepository.findById(me.getId())).thenReturn(Optional.of(me));
        when(userRepository.findByEmail(me.getEmail())).thenReturn(Optional.of(me));
        when(followRepository.countFollowers(anyLong())).thenReturn(0L);
        when(followRepository.countFollowing(anyLong())).thenReturn(0L);
        when(postRepository.findByUserId(anyLong())).thenReturn(List.of());

        UserProfileResponse result = userService.getProfile(me.getId(), me.getEmail());

        assertThat(result.followedByMe()).isFalse();
        verify(followRepository, never()).exists(anyLong(), anyLong());
    }
}
