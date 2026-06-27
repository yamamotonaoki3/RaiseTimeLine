package com.raisetimeline.api.like;

import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public class LikeRepository {

    private final LikeMapper likeMapper;

    public LikeRepository(LikeMapper likeMapper) {
        this.likeMapper = likeMapper;
    }

    public void insert(Long postId, Long userId) {
        likeMapper.insert(postId, userId);
    }

    public void delete(Long postId, Long userId) {
        likeMapper.delete(postId, userId);
    }

    public boolean exists(Long postId, Long userId) {
        return likeMapper.exists(postId, userId);
    }

    public List<PostCount> countByPostIds(List<Long> postIds) {
        return likeMapper.countByPostIds(postIds);
    }

    public List<Long> likedPostIdsByUser(List<Long> postIds, Long userId) {
        return likeMapper.likedPostIdsByUser(postIds, userId);
    }
}
