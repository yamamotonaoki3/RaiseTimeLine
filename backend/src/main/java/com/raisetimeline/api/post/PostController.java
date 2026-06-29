package com.raisetimeline.api.post;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Validated
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

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> create(
            @RequestParam @NotBlank(message = "投稿内容は必須です")
            @Size(max = 280, message = "投稿は280文字以内で入力してください") String content,
            @RequestParam(required = false) MultipartFile image,
            Authentication authentication) {
        PostResponse post = postService.create(authentication.getName(), content, image);
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PostResponse> update(
            @PathVariable Long id,
            @RequestParam @NotBlank(message = "投稿内容は必須です")
            @Size(max = 280, message = "投稿は280文字以内で入力してください") String content,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false, defaultValue = "false") boolean removeImage,
            Authentication authentication) {
        PostResponse post = postService.update(id, authentication.getName(), content, image, removeImage);
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
