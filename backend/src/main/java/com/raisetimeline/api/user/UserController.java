package com.raisetimeline.api.user;

import com.raisetimeline.api.exception.BadRequestException;
import com.raisetimeline.api.follow.FollowRepository;
import com.raisetimeline.api.follow.FollowService;
import com.raisetimeline.api.post.PostResponse;
import com.raisetimeline.api.post.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@Tag(name = "ユーザー", description = "プロフィール・フォロー・ユーザー検索")
@SecurityRequirement(name = "bearer-jwt")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final FollowService followService;
    private final FollowRepository followRepository;
    private final PostService postService;

    public UserController(UserService userService, UserRepository userRepository,
                          FollowService followService, FollowRepository followRepository,
                          PostService postService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.followService = followService;
        this.followRepository = followRepository;
        this.postService = postService;
    }

    @GetMapping("/{id}")
    @Operation(summary = "プロフィール取得")
    public UserProfileResponse getProfile(@PathVariable Long id, Authentication auth) {
        return userService.getProfile(id, auth.getName());
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "プロフィール更新", description = "表示名・自己紹介・アバター画像を更新します")
    public UserProfileResponse updateProfile(
            @PathVariable Long id,
            @Parameter(description = "表示名") @RequestParam String displayName,
            @Parameter(description = "自己紹介文（任意）") @RequestParam(required = false) String bio,
            @Parameter(description = "アバター画像（任意）")
            @RequestParam(name = "avatar", required = false) MultipartFile avatar,
            Authentication auth) {
        return userService.updateProfile(id, auth.getName(), displayName, bio, avatar);
    }

    @GetMapping("/{id}/posts")
    @Operation(summary = "ユーザーの投稿一覧取得")
    public List<PostResponse> getUserPosts(@PathVariable Long id, Authentication auth) {
        return postService.getByUserId(id, auth.getName());
    }

    @PostMapping("/{id}/follows")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "フォロー")
    public void follow(@PathVariable Long id, Authentication auth) {
        followService.follow(id, auth.getName());
    }

    @DeleteMapping("/{id}/follows")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "フォロー解除")
    public void unfollow(@PathVariable Long id, Authentication auth) {
        followService.unfollow(id, auth.getName());
    }

    @GetMapping("/{id}/followers")
    @Operation(summary = "フォロワー一覧取得")
    public List<UserSummaryResponse> getFollowers(@PathVariable Long id, Authentication auth) {
        return followService.getFollowers(id, auth.getName());
    }

    @GetMapping("/{id}/following")
    @Operation(summary = "フォロー中一覧取得")
    public List<UserSummaryResponse> getFollowing(@PathVariable Long id, Authentication auth) {
        return followService.getFollowing(id, auth.getName());
    }

    @GetMapping("/search")
    @Operation(summary = "ユーザー検索", description = "表示名または読み仮名の部分一致でユーザーを検索します")
    public List<UserSummaryResponse> search(
            @Parameter(description = "検索キーワード") @RequestParam String q,
            @Parameter(description = "ページ番号（0始まり）") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "1ページの取得件数") @RequestParam(defaultValue = "20") int size,
            Authentication auth) {
        if (q == null || q.isBlank()) {
            throw new BadRequestException("検索キーワードを入力してください");
        }
        User me = userRepository.findByEmail(auth.getName()).orElseThrow();
        return userRepository.search(q, me.getId(), page, size).stream()
                .map(u -> new UserSummaryResponse(
                        u.getId(),
                        u.getDisplayName(),
                        u.getAvatarUrl(),
                        u.getBio(),
                        followRepository.exists(me.getId(), u.getId())))
                .toList();
    }
}
