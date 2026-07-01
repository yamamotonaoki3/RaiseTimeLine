package com.raisetimeline.api.post;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.raisetimeline.api.auth.LoginRequest;
import com.raisetimeline.api.auth.RegisterRequest;
import com.raisetimeline.api.user.AvatarStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
class PostControllerTest {

    @Autowired
    private WebApplicationContext context;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private S3PostImageService s3PostImageService;

    @MockitoBean
    private AvatarStorageService avatarStorageService;

    private MockMvc mockMvc;
    private String accessToken;

    @BeforeEach
    void setUp() throws Exception {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();

        String email = "post-test-" + System.nanoTime() + "@example.com";
        String username = "post_tst_" + (System.nanoTime() % 100000);
        String displayName = "投稿テスト" + System.nanoTime();

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
    }

    // --- POST /api/posts 同値分割・境界値 ---

    @Test
    @DisplayName("POST /api/posts: 有効な content → 201")
    void createPost_validContent_returns201() throws Exception {
        mockMvc.perform(multipart("/api/posts")
                        .param("content", "投稿テスト")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/posts: content が空（無効クラス）→ 400")
    void createPost_emptyContent_returns400() throws Exception {
        mockMvc.perform(multipart("/api/posts")
                        .param("content", "")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/posts: content が 280 文字（境界値：最大）→ 201")
    void createPost_maxContent_returns201() throws Exception {
        String content280 = "あ".repeat(280);
        mockMvc.perform(multipart("/api/posts")
                        .param("content", content280)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/posts: content が 281 文字（境界値：最大+1）→ 400")
    void createPost_overMaxContent_returns400() throws Exception {
        String content281 = "あ".repeat(281);
        mockMvc.perform(multipart("/api/posts")
                        .param("content", content281)
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/posts: 画像あり（有効クラス）→ 201")
    void createPost_withImage_returns201() throws Exception {
        MockMultipartFile image = new MockMultipartFile(
                "image", "test.jpg", "image/jpeg", "dummy-image-data".getBytes());
        mockMvc.perform(multipart("/api/posts")
                        .file(image)
                        .param("content", "画像あり投稿")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("POST /api/posts: 認証なし（無効クラス）→ 401")
    void createPost_noToken_returns401() throws Exception {
        mockMvc.perform(multipart("/api/posts")
                        .param("content", "投稿テスト"))
                .andExpect(status().isUnauthorized());
    }

    // --- GET /api/posts パラメータ同値分割 ---

    @Test
    @DisplayName("GET /api/posts: feed 省略（有効クラス：全体）→ 200")
    void getPosts_feedAll_returns200() throws Exception {
        mockMvc.perform(get("/api/posts")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/posts: feed=following → 200")
    void getPosts_feedFollowing_returns200() throws Exception {
        mockMvc.perform(get("/api/posts")
                        .param("feed", "following")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/posts: cursor あり → 200")
    void getPosts_withCursor_returns200() throws Exception {
        mockMvc.perform(get("/api/posts")
                        .param("cursor", "100")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());
    }
}
