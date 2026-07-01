package com.raisetimeline.api.like;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts/{postId}/like")
@Tag(name = "いいね", description = "投稿へのいいね追加・削除")
@SecurityRequirement(name = "bearer-jwt")
public class LikeController {

    private final LikeService likeService;

    public LikeController(LikeService likeService) {
        this.likeService = likeService;
    }

    @PostMapping
    @Operation(summary = "いいね追加")
    public ResponseEntity<Void> like(
            @PathVariable Long postId,
            Authentication authentication) {
        likeService.like(postId, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    @Operation(summary = "いいね削除")
    public ResponseEntity<Void> unlike(
            @PathVariable Long postId,
            Authentication authentication) {
        likeService.unlike(postId, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
