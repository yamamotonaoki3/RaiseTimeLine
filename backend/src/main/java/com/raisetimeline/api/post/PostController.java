package com.raisetimeline.api.post;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    public ResponseEntity<List<PostResponse>> getPosts(
            @RequestParam(required = false) Long cursor,
            @RequestParam(required = false, defaultValue = "all") String feed,
            Authentication authentication) {
        boolean following = "following".equals(feed);
        List<PostResponse> posts = cursor == null
                ? (following ? postService.getLatestFollowing(authentication.getName())
                             : postService.getLatest(authentication.getName()))
                : (following ? postService.getBeforeFollowing(cursor, authentication.getName())
                             : postService.getBefore(cursor, authentication.getName()));
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPost(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(postService.getById(id, authentication.getName()));
    }

    @GetMapping("/new-count")
    public ResponseEntity<Map<String, Long>> getNewCount(
            @RequestParam Long sinceId,
            @RequestParam(required = false, defaultValue = "all") String feed,
            Authentication authentication) {
        long count = "following".equals(feed)
                ? postService.countNewerThanFollowing(sinceId, authentication.getName())
                : postService.countNewerThan(sinceId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/newer")
    public ResponseEntity<List<PostResponse>> getNewer(
            @RequestParam Long sinceId,
            @RequestParam(required = false, defaultValue = "all") String feed,
            Authentication authentication) {
        List<PostResponse> posts = "following".equals(feed)
                ? postService.getNewerThanFollowing(sinceId, authentication.getName())
                : postService.getNewerThan(sinceId, authentication.getName());
        return ResponseEntity.ok(posts);
    }

    @PostMapping
    public ResponseEntity<PostResponse> create(
            @RequestBody @Valid PostRequest request,
            Authentication authentication) {
        PostResponse post = postService.create(authentication.getName(), request.content());
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<PostResponse> update(
            @PathVariable Long id,
            @RequestBody @Valid PostRequest request,
            Authentication authentication) {
        PostResponse post = postService.update(id, authentication.getName(), request.content());
        return ResponseEntity.ok(post);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {
        postService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
