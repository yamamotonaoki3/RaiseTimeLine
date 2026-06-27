package com.raisetimeline.api.comment;

import com.raisetimeline.api.like.PostCount;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public class CommentRepository {

    private final CommentMapper commentMapper;

    public CommentRepository(CommentMapper commentMapper) {
        this.commentMapper = commentMapper;
    }

    public List<CommentResponse> findByPostId(Long postId) {
        return commentMapper.findByPostId(postId);
    }

    public Optional<CommentResponse> findById(Long id) {
        return commentMapper.findById(id);
    }

    public void insert(Comment comment) {
        commentMapper.insert(comment);
    }

    public void delete(Long id) {
        commentMapper.delete(id);
    }

    public List<PostCount> countByPostIds(List<Long> postIds) {
        return commentMapper.countByPostIds(postIds);
    }
}
