package com.raisetimeline.api.comment;

import com.raisetimeline.api.exception.CommentNotFoundException;
import com.raisetimeline.api.exception.ForbiddenException;
import com.raisetimeline.api.exception.PostNotFoundException;
import com.raisetimeline.api.post.PostRepository;
import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public CommentService(CommentRepository commentRepository,
                          PostRepository postRepository,
                          UserRepository userRepository) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
    }

    public List<CommentResponse> getByPostId(Long postId) {
        postRepository.findById(postId)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        return commentRepository.findByPostId(postId);
    }

    public CommentResponse create(Long postId, String email, String content) {
        postRepository.findById(postId)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        User user = userRepository.findByEmail(email).orElseThrow();
        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setUserId(user.getId());
        comment.setContent(content);
        commentRepository.insert(comment);
        return commentRepository.findById(comment.getId()).orElseThrow();
    }

    public void delete(Long postId, Long commentId, String email) {
        CommentResponse existing = commentRepository.findById(commentId)
                .orElseThrow(() -> new CommentNotFoundException("コメントが見つかりません"));
        if (!existing.postId().equals(postId)) {
            throw new CommentNotFoundException("コメントが見つかりません");
        }
        User user = userRepository.findByEmail(email).orElseThrow();
        if (!existing.userId().equals(user.getId())) {
            throw new ForbiddenException("このコメントを削除する権限がありません");
        }
        commentRepository.delete(commentId);
    }
}
