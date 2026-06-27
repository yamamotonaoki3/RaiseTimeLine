package com.raisetimeline.api.like;

import com.raisetimeline.api.exception.PostNotFoundException;
import com.raisetimeline.api.post.PostRepository;
import com.raisetimeline.api.user.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class LikeService {

    private final LikeRepository likeRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public LikeService(LikeRepository likeRepository,
                       PostRepository postRepository,
                       UserRepository userRepository) {
        this.likeRepository = likeRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    public void like(Long postId, String email) {
        postRepository.findById(postId)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        Long userId = userRepository.findByEmail(email).orElseThrow().getId();
        likeRepository.insert(postId, userId);
    }

    public void unlike(Long postId, String email) {
        postRepository.findById(postId)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        Long userId = userRepository.findByEmail(email).orElseThrow().getId();
        likeRepository.delete(postId, userId);
    }
}
