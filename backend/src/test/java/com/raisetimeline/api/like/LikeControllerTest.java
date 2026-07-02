package com.raisetimeline.api.like;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.raisetimeline.api.auth.LoginRequest;
import com.raisetimeline.api.auth.RegisterRequest;
import com.raisetimeline.api.post.S3PostImageService;
import com.raisetimeline.api.user.AvatarStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
class LikeControllerTest {

    @Autowired
    private WebApplicationContext context;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private S3PostImageService s3PostImageService;

    @MockitoBean
    private AvatarStorageService avatarStorageService;

    private MockMvc mockMvc;
    private String accessToken;
    private Long postId;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        String email = "like-test-" + System.nanoTime() + "@example.com";
        String username = "like_tst_" + (System.nanoTime() % 100000);
        String displayName = "いいねテスト" + System.nanoTime();

        String regBody = objectMapper.writeValueAsString(
                new RegisterRequest(email, username, displayName, "Pass1234", null));
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(regBody));

        String loginBody = objectMapper.writeValueAsString(new LoginRequest(email, "Pass1234"));
        String resp = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andReturn().getResponse().getContentAsString();
        accessToken = objectMapper.readTree(resp).get("accessToken").asText();

        String postResp = mockMvc.perform(multipart("/api/posts")
                        .param("content", "いいね対象投稿")
                        .header("Authorization", "Bearer " + accessToken))
                .andReturn().getResponse().getContentAsString();
        postId = objectMapper.readTree(postResp).get("id").asLong();
    }

    // --- POST /api/posts/{postId}/like ---

    @Test
    @DisplayName("POST /like: 認証済みでいいねすると 204")
    void like_authenticated_returns204() throws Exception {
        mockMvc.perform(post("/api/posts/" + postId + "/like")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("POST /like: 存在しない投稿へのいいねは 404")
    void like_postNotFound_returns404() throws Exception {
        mockMvc.perform(post("/api/posts/999999/like")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /like: 認証なし（無効クラス）→ 401")
    void like_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/posts/" + postId + "/like"))
                .andExpect(status().isUnauthorized());
    }

    // --- DELETE /api/posts/{postId}/like ---

    @Test
    @DisplayName("DELETE /like: いいね済みの投稿を取り消すと 204")
    void unlike_authenticated_returns204() throws Exception {
        mockMvc.perform(post("/api/posts/" + postId + "/like")
                        .header("Authorization", "Bearer " + accessToken));

        mockMvc.perform(delete("/api/posts/" + postId + "/like")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /like: 存在しない投稿へのいいね取り消しは 404")
    void unlike_postNotFound_returns404() throws Exception {
        mockMvc.perform(delete("/api/posts/999999/like")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /like: 認証なし（無効クラス）→ 401")
    void unlike_noToken_returns401() throws Exception {
        mockMvc.perform(delete("/api/posts/" + postId + "/like"))
                .andExpect(status().isUnauthorized());
    }
}
