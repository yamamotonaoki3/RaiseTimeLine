package com.raisetimeline.api.post;

import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class PostRepository {

    private final PostMapper postMapper;

    public PostRepository(PostMapper postMapper) {
        this.postMapper = postMapper;
    }

    public List<PostRow> findLatest(int limit) {
        return postMapper.findLatest(limit);
    }

    public List<PostRow> findBefore(Long cursor, int limit) {
        return postMapper.findBefore(cursor, limit);
    }

    public List<PostRow> findNewerThan(Long sinceId) {
        return postMapper.findNewerThan(sinceId);
    }

    public long countNewerThan(Long sinceId) {
        return postMapper.countNewerThan(sinceId);
    }

    public Optional<PostRow> findById(Long id) {
        return postMapper.findById(id);
    }

    public void insert(Post post) {
        postMapper.insert(post);
    }

    public void update(Long id, String content) {
        postMapper.update(id, content);
    }

    public void delete(Long id) {
        postMapper.delete(id);
    }

    public List<PostRow> findByUserId(Long userId) {
        return postMapper.findByUserId(userId);
    }
}
