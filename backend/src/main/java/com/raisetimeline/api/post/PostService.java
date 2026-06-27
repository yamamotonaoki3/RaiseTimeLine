package com.raisetimeline.api.post;

import com.raisetimeline.api.comment.CommentMapper;
import com.raisetimeline.api.exception.ForbiddenException;
import com.raisetimeline.api.exception.PostNotFoundException;
import com.raisetimeline.api.like.LikeMapper;
import com.raisetimeline.api.like.PostCount;
import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserMapper;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class PostService {

    private static final int PAGE_SIZE = 20;

    private final PostMapper postMapper;
    private final UserMapper userMapper;
    private final LikeMapper likeMapper;
    private final CommentMapper commentMapper;

    public PostService(PostMapper postMapper, UserMapper userMapper,
                       LikeMapper likeMapper, CommentMapper commentMapper) {
        this.postMapper = postMapper;
        this.userMapper = userMapper;
        this.likeMapper = likeMapper;
        this.commentMapper = commentMapper;
    }

    public List<PostResponse> getLatest(String email) {
        return enrich(postMapper.findLatest(PAGE_SIZE), email);
    }

    public List<PostResponse> getBefore(Long cursor, String email) {
        return enrich(postMapper.findBefore(cursor, PAGE_SIZE), email);
    }

    public long countNewerThan(Long sinceId) {
        return postMapper.countNewerThan(sinceId);
    }

    public List<PostResponse> getNewerThan(Long sinceId, String email) {
        return enrich(postMapper.findNewerThan(sinceId), email);
    }

    public PostResponse getById(Long id, String email) {
        PostRow row = postMapper.findById(id)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        return enrich(List.of(row), email).get(0);
    }

    public PostResponse create(String email, String content) {
        User user = userMapper.findByEmail(email).orElseThrow();
        Post post = new Post();
        post.setUserId(user.getId());
        post.setContent(content);
        postMapper.insert(post);
        PostRow row = postMapper.findById(post.getId()).orElseThrow();
        return enrich(List.of(row), email).get(0);
    }

    public PostResponse update(Long id, String email, String content) {
        PostRow existing = postMapper.findById(id)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        User user = userMapper.findByEmail(email).orElseThrow();
        if (!existing.userId().equals(user.getId())) {
            throw new ForbiddenException("この投稿を編集する権限がありません");
        }
        postMapper.update(id, content);
        PostRow row = postMapper.findById(id).orElseThrow();
        return enrich(List.of(row), email).get(0);
    }

    public void delete(Long id, String email) {
        PostRow existing = postMapper.findById(id)
                .orElseThrow(() -> new PostNotFoundException("投稿が見つかりません"));
        User user = userMapper.findByEmail(email).orElseThrow();
        if (!existing.userId().equals(user.getId())) {
            throw new ForbiddenException("この投稿を削除する権限がありません");
        }
        postMapper.delete(id);
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
        Long userId = userMapper.findByEmail(email).orElseThrow().getId();

        Map<Long, Long> likeCounts = likeMapper.countByPostIds(postIds).stream()
                .collect(Collectors.toMap(PostCount::getPostId, PostCount::getCnt));

        Set<Long> likedPostIds = Set.copyOf(likeMapper.likedPostIdsByUser(postIds, userId));

        Map<Long, Long> commentCounts = commentMapper.countByPostIds(postIds).stream()
                .collect(Collectors.toMap(PostCount::getPostId, PostCount::getCnt));

        return rows.stream().map(r -> new PostResponse(
                r.id(),
                r.userId(),
                r.displayName(),
                r.content(),
                r.createdAt(),
                r.updatedAt(),
                likeCounts.getOrDefault(r.id(), 0L),
                likedPostIds.contains(r.id()),
                commentCounts.getOrDefault(r.id(), 0L)
        )).toList();
    }
}
