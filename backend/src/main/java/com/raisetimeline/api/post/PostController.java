package com.raisetimeline.api.post;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "投稿", description = "投稿の作成・更新・削除・タイムライン取得")
@SecurityRequirement(name = "bearer-jwt")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    @GetMapping
    @Operation(summary = "投稿一覧取得",
            description = "タイムラインの投稿を取得します。feed=following でフォロー中のみに絞り込み可能")
    public ResponseEntity<List<PostResponse>> getPosts(
            @Parameter(description = "カーソル位置（前ページ最後の投稿 ID）")
            @RequestParam(required = false) Long cursor,
            @Parameter(description = "フィード種別：all（全体）または following（フォロー中）")
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
    @Operation(summary = "投稿詳細取得")
    public ResponseEntity<PostResponse> getPost(
            @PathVariable Long id,
            Authentication authentication) {
        return ResponseEntity.ok(postService.getById(id, authentication.getName()));
    }

    @GetMapping("/new-count")
    @Operation(summary = "新着件数チェック", description = "指定 ID より新しい投稿の件数を返します（30秒ポーリング用）")
    public ResponseEntity<Map<String, Long>> getNewCount(
            @Parameter(description = "現在先頭の投稿 ID") @RequestParam Long sinceId,
            @Parameter(description = "フィード種別：all または following")
            @RequestParam(required = false, defaultValue = "all") String feed,
            Authentication authentication) {
        long count = "following".equals(feed)
                ? postService.countNewerThanFollowing(sinceId, authentication.getName())
                : postService.countNewerThan(sinceId);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/newer")
    @Operation(summary = "新着投稿取得", description = "指定 ID より新しい投稿を取得します（バナークリック時）")
    public ResponseEntity<List<PostResponse>> getNewer(
            @Parameter(description = "現在先頭の投稿 ID") @RequestParam Long sinceId,
            @Parameter(description = "フィード種別：all または following")
            @RequestParam(required = false, defaultValue = "all") String feed,
            Authentication authentication) {
        List<PostResponse> posts = "following".equals(feed)
                ? postService.getNewerThanFollowing(sinceId, authentication.getName())
                : postService.getNewerThan(sinceId, authentication.getName());
        return ResponseEntity.ok(posts);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "投稿作成", description = "テキストと任意の画像で新規投稿を作成します")
    public ResponseEntity<PostResponse> create(
            @Parameter(description = "投稿内容（最大280文字）")
            @RequestParam @NotBlank(message = "投稿内容は必須です")
            @Size(max = 280, message = "投稿は280文字以内で入力してください") String content,
            @Parameter(description = "添付画像（任意）") @RequestParam(required = false) MultipartFile image,
            Authentication authentication) {
        PostResponse post = postService.create(authentication.getName(), content, image);
        return ResponseEntity.status(HttpStatus.CREATED).body(post);
    }

    @PatchMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "投稿更新", description = "本人の投稿を更新します")
    public ResponseEntity<PostResponse> update(
            @PathVariable Long id,
            @Parameter(description = "投稿内容（最大280文字）")
            @RequestParam @NotBlank(message = "投稿内容は必須です")
            @Size(max = 280, message = "投稿は280文字以内で入力してください") String content,
            @Parameter(description = "添付画像（任意）") @RequestParam(required = false) MultipartFile image,
            @Parameter(description = "画像を削除する場合は true")
            @RequestParam(required = false, defaultValue = "false") boolean removeImage,
            Authentication authentication) {
        PostResponse post = postService.update(id, authentication.getName(), content, image, removeImage);
        return ResponseEntity.ok(post);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "投稿削除", description = "本人の投稿を削除します")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {
        postService.delete(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
