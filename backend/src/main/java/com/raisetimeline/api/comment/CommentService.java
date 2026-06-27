package com.raisetimeline.api.comment;

import com.raisetimeline.api.exception.CommentNotFoundException;
import com.raisetimeline.api.exception.ForbiddenException;
import com.raisetimeline.api.exception.PostNotFoundException;
import com.raisetimeline.api.post.PostMapper;
import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserMapper;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CommentService {

    private final CommentMapper commentMapper;
    private final PostMapper postMapper;
    private final UserMapper userMapper;

    public CommentService(CommentMapper commentMapper, PostMapper postMapper, UserMapper userMapper) {
        this.commentMapper = commentMapper;
        this.postMapper = postMapper;
        this.userMapper = userMapper;
    }

    public List<CommentResponse> getByPostId(Long postId) {
        postMapper.findById(postId)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        return commentMapper.findByPostId(postId);
    }

    public CommentResponse create(Long postId, String email, String content) {
        postMapper.findById(postId)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        User user = userMapper.findByEmail(email).orElseThrow();
        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setUserId(user.getId());
        comment.setContent(content);
        commentMapper.insert(comment);
        return commentMapper.findById(comment.getId()).orElseThrow();
    }

    public void delete(Long postId, Long commentId, String email) {
        CommentResponse existing = commentMapper.findById(commentId)
                .orElseThrow(() -> new CommentNotFoundException("コメントが見つかりません"));
        if (!existing.postId().equals(postId)) {
            throw new CommentNotFoundException("コメントが見つかりません");
        }
        User user = userMapper.findByEmail(email).orElseThrow();
        if (!existing.userId().equals(user.getId())) {
            throw new ForbiddenException("このコメントを削除する権限がありません");
        }
        commentMapper.delete(commentId);
    }
}
