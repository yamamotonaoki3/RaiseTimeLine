package com.raisetimeline.api.follow;

import com.raisetimeline.api.exception.AlreadyFollowingException;
import com.raisetimeline.api.exception.NotFollowingException;
import com.raisetimeline.api.exception.SelfFollowException;
import com.raisetimeline.api.exception.UserNotFoundException;
import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserRepository;
import com.raisetimeline.api.user.UserSummaryResponse;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class FollowService {

    private final FollowRepository followRepository;
    private final UserRepository userRepository;

    public FollowService(FollowRepository followRepository, UserRepository userRepository) {
        this.followRepository = followRepository;
        this.userRepository = userRepository;
    }

    public void follow(Long targetUserId, String requestEmail) {
        User me = userRepository.findByEmail(requestEmail).orElseThrow();
        if (me.getId().equals(targetUserId)) {
            throw new SelfFollowException("自分自身をフォローすることはできません");
        }
        userRepository.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException("ユーザーが見つかりません"));
        if (followRepository.exists(me.getId(), targetUserId)) {
            throw new AlreadyFollowingException("既にフォロー済みです");
        }
        followRepository.insert(me.getId(), targetUserId);
    }

    public void unfollow(Long targetUserId, String requestEmail) {
        User me = userRepository.findByEmail(requestEmail).orElseThrow();
        userRepository.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException("ユーザーが見つかりません"));
        if (!followRepository.exists(me.getId(), targetUserId)) {
            throw new NotFollowingException("フォローしていません");
        }
        followRepository.delete(me.getId(), targetUserId);
    }

    public List<UserSummaryResponse> getFollowers(Long targetUserId, String requestEmail) {
        userRepository.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException("ユーザーが見つかりません"));
        User me = userRepository.findByEmail(requestEmail).orElseThrow();
        return followRepository.findFollowers(targetUserId).stream()
                .map(u -> toSummary(u, me.getId()))
                .toList();
    }

    public List<UserSummaryResponse> getFollowing(Long targetUserId, String requestEmail) {
        userRepository.findById(targetUserId)
                .orElseThrow(() -> new UserNotFoundException("ユーザーが見つかりません"));
        User me = userRepository.findByEmail(requestEmail).orElseThrow();
        return followRepository.findFollowing(targetUserId).stream()
                .map(u -> toSummary(u, me.getId()))
                .toList();
    }

    private UserSummaryResponse toSummary(User u, Long myId) {
        boolean followedByMe = !u.getId().equals(myId) && followRepository.exists(myId, u.getId());
        return new UserSummaryResponse(u.getId(), u.getDisplayName(), u.getAvatarUrl(), u.getBio(), followedByMe);
    }
}
