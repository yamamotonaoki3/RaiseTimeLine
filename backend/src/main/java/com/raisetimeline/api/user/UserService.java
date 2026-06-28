package com.raisetimeline.api.user;

import com.raisetimeline.api.exception.ForbiddenException;
import com.raisetimeline.api.exception.UserNotFoundException;
import com.raisetimeline.api.follow.FollowRepository;
import com.raisetimeline.api.post.PostRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final FollowRepository followRepository;
    private final PostRepository postRepository;
    private final AvatarStorageService avatarStorageService;

    public UserService(UserRepository userRepository,
                       FollowRepository followRepository,
                       PostRepository postRepository,
                       AvatarStorageService avatarStorageService) {
        this.userRepository = userRepository;
        this.followRepository = followRepository;
        this.postRepository = postRepository;
        this.avatarStorageService = avatarStorageService;
    }

    public UserProfileResponse getProfile(Long targetUserId, String requestEmail) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException("ユーザーが見つかりません"));

        User me = userRepository.findByEmail(requestEmail).orElseThrow();

        long followerCount = followRepository.countFollowers(targetUserId);
        long followingCount = followRepository.countFollowing(targetUserId);
        long postCount = postRepository.findByUserId(targetUserId).size();
        boolean followedByMe = !me.getId().equals(targetUserId)
                && followRepository.exists(me.getId(), targetUserId);

        return new UserProfileResponse(
                target.getId(),
                target.getDisplayName(),
                target.getAvatarUrl(),
                target.getBio(),
                followerCount,
                followingCount,
                postCount,
                followedByMe
        );
    }

    public UserProfileResponse updateProfile(Long targetUserId, String requestEmail,
                                             String displayName, String bio, MultipartFile avatar) {
        User me = userRepository.findByEmail(requestEmail).orElseThrow();
        if (!me.getId().equals(targetUserId)) {
            throw new ForbiddenException("このプロフィールを編集する権限がありません");
        }
        String avatarUrl = null;
        if (avatar != null && !avatar.isEmpty()) {
            avatarUrl = avatarStorageService.store(avatar, me.getAvatarUrl());
        }
        userRepository.update(targetUserId, displayName, bio, avatarUrl);
        return getProfile(targetUserId, requestEmail);
    }
}
