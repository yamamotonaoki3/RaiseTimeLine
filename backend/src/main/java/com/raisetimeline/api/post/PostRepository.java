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

    public void update(Long id, String content, String imageUrl) {
        postMapper.update(id, content, imageUrl);
    }

    public void delete(Long id) {
        postMapper.delete(id);
    }

    public List<PostRow> findLatestFollowing(Long userId, int limit) {
        return postMapper.findLatestFollowing(userId, limit);
    }

    public List<PostRow> findBeforeFollowing(Long userId, Long cursor, int limit) {
        return postMapper.findBeforeFollowing(userId, cursor, limit);
    }

    public long countNewerThanFollowing(Long userId, Long sinceId) {
        return postMapper.countNewerThanFollowing(userId, sinceId);
    }

    public List<PostRow> findNewerThanFollowing(Long userId, Long sinceId) {
        return postMapper.findNewerThanFollowing(userId, sinceId);
    }

    public List<PostRow> findByUserId(Long userId) {
        return postMapper.findByUserId(userId);
    }
}
