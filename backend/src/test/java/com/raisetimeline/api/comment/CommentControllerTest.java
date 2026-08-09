package com.raisetimeline.api.comment;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.raisetimeline.api.auth.LoginRequest;
import com.raisetimeline.api.auth.RegisterRequest;
import com.raisetimeline.api.post.S3PostImageService;
import com.raisetimeline.api.user.S3AvatarService;
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
class CommentControllerTest {

    @Autowired
    private WebApplicationContext context;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private S3PostImageService s3PostImageService;

    @MockitoBean
    private S3AvatarService s3AvatarService;

    private MockMvc mockMvc;
    private String accessToken;
    private Long postId;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        String email = "comment-test-" + System.nanoTime() + "@example.com";
        String username = "comment_tst_" + (System.nanoTime() % 100000);
        String displayName = "コメントテスト" + System.nanoTime();

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

        String postResp = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .multipart("/api/posts")
                        .param("content", "コメント対象投稿")
                        .header("Authorization", "Bearer " + accessToken))
                .andReturn().getResponse().getContentAsString();
        postId = objectMapper.readTree(postResp).get("id").asLong();
    }

    // --- POST /api/posts/{postId}/comments 同値分割・境界値 ---

    @Test
    @DisplayName("POST /comments: 有効な content → 201")
    void createComment_validContent_returns201() throws Exception {
        String body = objectMapper.writeValueAsString(new CommentRequest("コメント本文"));
        mockMvc.perform(post("/api/posts/" + postId + "/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /comments: content が空（無効クラス）→ 400")
    void createComment_emptyContent_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(new CommentRequest(""));
        mockMvc.perform(post("/api/posts/" + postId + "/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /comments: content が 280 文字（境界値：最大）→ 201")
    void createComment_maxContent_returns201() throws Exception {
        String body = objectMapper.writeValueAsString(new CommentRequest("あ".repeat(280)));
        mockMvc.perform(post("/api/posts/" + postId + "/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /comments: content が 281 文字（境界値：最大+1）→ 400")
    void createComment_overMaxContent_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(new CommentRequest("あ".repeat(281)));
        mockMvc.perform(post("/api/posts/" + postId + "/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /comments: 認証なし（無効クラス）→ 401")
    void createComment_noToken_returns401() throws Exception {
        String body = objectMapper.writeValueAsString(new CommentRequest("コメント"));
        mockMvc.perform(post("/api/posts/" + postId + "/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    // --- GET /api/posts/{postId}/comments ---

    @Test
    @DisplayName("GET /comments: 認証済みなら 200")
    void getComments_authenticated_returns200() throws Exception {
        mockMvc.perform(get("/api/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());
    }

    // --- DELETE /api/posts/{postId}/comments/{commentId} ---

    @Test
    @DisplayName("DELETE /comments/{id}: 本人のコメントは削除できる → 204")
    void deleteComment_ownComment_returns204() throws Exception {
        String body = objectMapper.writeValueAsString(new CommentRequest("削除対象"));
        String createResp = mockMvc.perform(post("/api/posts/" + postId + "/comments")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .header("Authorization", "Bearer " + accessToken))
                .andReturn().getResponse().getContentAsString();
        Long commentId = objectMapper.readTree(createResp).get("id").asLong();

        mockMvc.perform(delete("/api/posts/" + postId + "/comments/" + commentId)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /comments/{id}: 存在しないコメント → 404")
    void deleteComment_notFound_returns404() throws Exception {
        mockMvc.perform(delete("/api/posts/" + postId + "/comments/999999")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /comments/{id}: 認証なし（無効クラス）→ 401")
    void deleteComment_noToken_returns401() throws Exception {
        mockMvc.perform(delete("/api/posts/" + postId + "/comments/1"))
                .andExpect(status().isUnauthorized());
    }
}
