package com.raisetimeline.api.post;

import com.raisetimeline.api.exception.ForbiddenException;
import com.raisetimeline.api.exception.PostNotFoundException;
import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserMapper;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PostService {

    private static final int PAGE_SIZE = 20;

    private final PostMapper postMapper;
    private final UserMapper userMapper;

    public PostService(PostMapper postMapper, UserMapper userMapper) {
        this.postMapper = postMapper;
        this.userMapper = userMapper;
    }

    public List<PostResponse> getLatest() {
        return postMapper.findLatest(PAGE_SIZE);
    }

    public List<PostResponse> getBefore(Long cursor) {
        return postMapper.findBefore(cursor, PAGE_SIZE);
    }

    public long countNewerThan(Long sinceId) {
        return postMapper.countNewerThan(sinceId);
    }

    public List<PostResponse> getNewerThan(Long sinceId) {
        return postMapper.findNewerThan(sinceId);
    }

    public PostResponse create(String email, String content) {
        User user = userMapper.findByEmail(email).orElseThrow();
        Post post = new Post();
        post.setUserId(user.getId());
        post.setContent(content);
        postMapper.insert(post);
        return postMapper.findById(post.getId()).orElseThrow();
    }

    public PostResponse update(Long id, String email, String content) {
        PostResponse existing = postMapper.findById(id)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        User user = userMapper.findByEmail(email).orElseThrow();
        if (!existing.userId().equals(user.getId())) {
            throw new ForbiddenException("この投稿を編集する権限がありません");
        }
        postMapper.update(id, content);
        return postMapper.findById(id).orElseThrow();
    }

    public void delete(Long id, String email) {
        PostResponse existing = postMapper.findById(id)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        User user = userMapper.findByEmail(email).orElseThrow();
        if (!existing.userId().equals(user.getId())) {
            throw new ForbiddenException("この投稿を削除する権限がありません");
        }
        postMapper.delete(id);
    }
}
