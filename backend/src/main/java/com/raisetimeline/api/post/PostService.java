package com.raisetimeline.api.post;

import com.raisetimeline.api.comment.CommentRepository;
import com.raisetimeline.api.exception.ForbiddenException;
import com.raisetimeline.api.exception.PostNotFoundException;
import com.raisetimeline.api.like.LikeRepository;
import com.raisetimeline.api.like.PostCount;
import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserRepository;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class PostService {

    private static final int PAGE_SIZE = 20;

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final LikeRepository likeRepository;
    private final CommentRepository commentRepository;

    public PostService(PostRepository postRepository, UserRepository userRepository,
                       LikeRepository likeRepository, CommentRepository commentRepository) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.likeRepository = likeRepository;
        this.commentRepository = commentRepository;
    }

    public List<PostResponse> getLatest(String email) {
        return enrich(postRepository.findLatest(PAGE_SIZE), email);
    }

    public List<PostResponse> getBefore(Long cursor, String email) {
        return enrich(postRepository.findBefore(cursor, PAGE_SIZE), email);
    }

    public long countNewerThan(Long sinceId) {
        return postRepository.countNewerThan(sinceId);
    }

    public List<PostResponse> getNewerThan(Long sinceId, String email) {
        return enrich(postRepository.findNewerThan(sinceId), email);
    }

    public PostResponse getById(Long id, String email) {
        PostRow row = postRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        return enrich(List.of(row), email).get(0);
    }

    public PostResponse create(String email, String content) {
        User user = userRepository.findByEmail(email).orElseThrow();
        Post post = new Post();
        post.setUserId(user.getId());
        post.setContent(content);
        postRepository.insert(post);
        PostRow row = postRepository.findById(post.getId()).orElseThrow();
        return enrich(List.of(row), email).get(0);
    }

    public PostResponse update(Long id, String email, String content) {
        PostRow existing = postRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        User user = userRepository.findByEmail(email).orElseThrow();
        if (!existing.userId().equals(user.getId())) {
            throw new ForbiddenException("この投稿を編集する権限がありません");
        }
        postRepository.update(id, content);
        PostRow row = postRepository.findById(id).orElseThrow();
        return enrich(List.of(row), email).get(0);
    }

    public List<PostResponse> getByUserId(Long userId, String email) {
        return enrich(postRepository.findByUserId(userId), email);
    }

    public void delete(Long id, String email) {
        PostRow existing = postRepository.findById(id)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        User user = userRepository.findByEmail(email).orElseThrow();
        if (!existing.userId().equals(user.getId())) {
            throw new ForbiddenException("この投稿を削除する権限がありません");
        }
        postRepository.delete(id);
    }

    /**
     * N+1対策：postIdsのリストに対していいね数・コメント数をバッチ取得してマッピングする。
     * クエリ数は投稿件数に関係なく3回固定。
     */
    private List<PostResponse> enrich(List<PostRow> rows, String email) {
        if (rows.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> postIds = rows.stream().map(PostRow::id).toList();
        Long userId = userRepository.findByEmail(email).orElseThrow().getId();

        Map<Long, Long> likeCounts = likeRepository.countByPostIds(postIds).stream()
                .collect(Collectors.toMap(PostCount::getPostId, PostCount::getCnt));

        Set<Long> likedPostIds = Set.copyOf(likeRepository.likedPostIdsByUser(postIds, userId));

        Map<Long, Long> commentCounts = commentRepository.countByPostIds(postIds).stream()
                .collect(Collectors.toMap(PostCount::getPostId, PostCount::getCnt));

        return rows.stream().map(r -> new PostResponse(
                r.id(),
                r.userId(),
                r.displayName(),
                r.avatarUrl(),
                r.content(),
                r.createdAt(),
                r.updatedAt(),
                likeCounts.getOrDefault(r.id(), 0L),
                likedPostIds.contains(r.id()),
                commentCounts.getOrDefault(r.id(), 0L)
        )).toList();
    }
}
