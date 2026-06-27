package com.raisetimeline.api.like;

import com.raisetimeline.api.exception.PostNotFoundException;
import com.raisetimeline.api.post.PostMapper;
import com.raisetimeline.api.user.UserMapper;
import org.springframework.stereotype.Service;

@Service
public class LikeService {

    private final LikeMapper likeMapper;
    private final PostMapper postMapper;
    private final UserMapper userMapper;

    public LikeService(LikeMapper likeMapper, PostMapper postMapper, UserMapper userMapper) {
        this.likeMapper = likeMapper;
        this.postMapper = postMapper;
        this.userMapper = userMapper;
    }

    public void like(Long postId, String email) {
        postMapper.findById(postId)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        Long userId = userMapper.findByEmail(email).orElseThrow().getId();
        likeMapper.insert(postId, userId);
    }

    public void unlike(Long postId, String email) {
        postMapper.findById(postId)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        Long userId = userMapper.findByEmail(email).orElseThrow().getId();
        likeMapper.delete(postId, userId);
    }
}
