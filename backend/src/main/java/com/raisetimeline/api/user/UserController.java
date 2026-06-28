package com.raisetimeline.api.user;

import com.raisetimeline.api.follow.FollowService;
import com.raisetimeline.api.post.PostResponse;
import com.raisetimeline.api.post.PostService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final FollowService followService;
    private final PostService postService;

    public UserController(UserService userService, FollowService followService, PostService postService) {
        this.userService = userService;
        this.followService = followService;
        this.postService = postService;
    }

    @GetMapping("/{id}")
    public UserProfileResponse getProfile(@PathVariable Long id, Authentication auth) {
        return userService.getProfile(id, auth.getName());
    }

    @PutMapping("/{id}")
    public UserProfileResponse updateProfile(@PathVariable Long id,
                                             @Valid @RequestBody UpdateProfileRequest request,
                                             Authentication auth) {
        return userService.updateProfile(id, auth.getName(), request);
    }

    @GetMapping("/{id}/posts")
    public List<PostResponse> getUserPosts(@PathVariable Long id, Authentication auth) {
        return postService.getByUserId(id, auth.getName());
    }

    @PostMapping("/{id}/follows")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void follow(@PathVariable Long id, Authentication auth) {
        followService.follow(id, auth.getName());
    }

    @DeleteMapping("/{id}/follows")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unfollow(@PathVariable Long id, Authentication auth) {
        followService.unfollow(id, auth.getName());
    }

    @GetMapping("/{id}/followers")
    public List<UserSummaryResponse> getFollowers(@PathVariable Long id, Authentication auth) {
        return followService.getFollowers(id, auth.getName());
    }

    @GetMapping("/{id}/following")
    public List<UserSummaryResponse> getFollowing(@PathVariable Long id, Authentication auth) {
        return followService.getFollowing(id, auth.getName());
    }
}
