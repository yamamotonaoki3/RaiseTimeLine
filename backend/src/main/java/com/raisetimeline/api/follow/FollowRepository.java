package com.raisetimeline.api.follow;

import com.raisetimeline.api.user.User;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class FollowRepository {

    private final FollowMapper followMapper;

    public FollowRepository(FollowMapper followMapper) {
        this.followMapper = followMapper;
    }

    public void insert(Long followerId, Long followeeId) {
        followMapper.insert(followerId, followeeId);
    }

    public void delete(Long followerId, Long followeeId) {
        followMapper.delete(followerId, followeeId);
    }

    public boolean exists(Long followerId, Long followeeId) {
        return followMapper.exists(followerId, followeeId);
    }

    public List<User> findFollowers(Long followeeId) {
        return followMapper.findFollowers(followeeId);
    }

    public List<User> findFollowing(Long followerId) {
        return followMapper.findFollowing(followerId);
    }

    public long countFollowers(Long followeeId) {
        return followMapper.countFollowers(followeeId);
    }

    public long countFollowing(Long followerId) {
        return followMapper.countFollowing(followerId);
    }
}
