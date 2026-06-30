package com.raisetimeline.api.auth;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
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
class AuthControllerTest {

    @Autowired
    private WebApplicationContext context;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private S3PostImageService s3PostImageService;

    @MockitoBean
    private AvatarStorageService avatarStorageService;

    private MockMvc mockMvc;

    private static final AuthResponse DUMMY_AUTH = new AuthResponse(
            "access-token", 1L, "テストユーザー", "test@example.com", null);
    private static final TokenPair DUMMY_PAIR = new TokenPair(DUMMY_AUTH, "refresh-token");

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    // --- POST /api/auth/register 同値分割・境界値分析 ---

    @Test
    @DisplayName("register: 有効な入力（代表値）→ 201")
    void register_validInput_returns201() throws Exception {
        String body = objectMapper.writeValueAsString(
                new RegisterRequest("valid@example.com", "valid_user", "テスト太郎", "Pass1234", null));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").exists());
    }

    @Test
    @DisplayName("register: username が 2 文字（境界値：最小-1）→ 400")
    void register_usernameTooShort_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(
                new RegisterRequest("short@example.com", "ab", "テスト", "Pass1234", null));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("register: username が 3 文字（境界値：最小）→ 201")
    void register_usernameMinBoundary_returns201() throws Exception {
        String body = objectMapper.writeValueAsString(
                new RegisterRequest("min3@example.com", "abc", "境界最小", "Pass1234", null));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("register: username が 51 文字（境界値：最大+1）→ 400")
    void register_usernameMaxPlusBoundary_returns400() throws Exception {
        String longUsername = "a".repeat(51);
        String body = objectMapper.writeValueAsString(
                new RegisterRequest("long@example.com", longUsername, "テスト", "Pass1234", null));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("register: username に禁止文字（@）→ 400")
    void register_usernameInvalidChar_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(
                new RegisterRequest("atmark@example.com", "user@name", "テスト", "Pass1234", null));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("register: displayName が空（境界値：最小-1）→ 400")
    void register_emptyDisplayName_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(
                new RegisterRequest("empty@example.com", "user_abc", "", "Pass1234", null));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("register: password が 7 文字（境界値：最小-1）→ 400")
    void register_passwordTooShort_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(
                new RegisterRequest("pw7@example.com", "user_pw7", "テスト", "Pass123", null));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("register: password が 8 文字（境界値：最小）→ 201")
    void register_passwordMinBoundary_returns201() throws Exception {
        String body = objectMapper.writeValueAsString(
                new RegisterRequest("pw8@example.com", "user_pw8", "パスワード8文字", "Pass1234", null));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());
    }

    // --- デシジョンテーブル：重複チェック（同メールで重複） ---

    @Test
    @DisplayName("register: email 重複（2回登録）→ 409")
    void register_duplicateEmail_returns409() throws Exception {
        String body = objectMapper.writeValueAsString(
                new RegisterRequest("dup@example.com", "dup_user1", "重複テスト1", "Pass1234", null));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());

        String body2 = objectMapper.writeValueAsString(
                new RegisterRequest("dup@example.com", "dup_user2", "重複テスト2", "Pass1234", null));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body2))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("register: username 重複（2回登録）→ 409")
    void register_duplicateUsername_returns409() throws Exception {
        String body = objectMapper.writeValueAsString(
                new RegisterRequest("uniq1@example.com", "same_name", "ユーザー名重複1", "Pass1234", null));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());

        String body2 = objectMapper.writeValueAsString(
                new RegisterRequest("uniq2@example.com", "same_name", "ユーザー名重複2", "Pass1234", null));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body2))
                .andExpect(status().isConflict());
    }

    // --- GET /api/auth/me 同値分割 ---

    @Test
    @DisplayName("GET /api/auth/me: 有効な JWT → 200")
    void getMe_validToken_returns200() throws Exception {
        String regBody = objectMapper.writeValueAsString(
                new RegisterRequest("me-test@example.com", "me_test_user", "自分テスト", "Pass1234", null));

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(regBody))
                .andExpect(status().isCreated());

        String loginBody = objectMapper.writeValueAsString(
                new LoginRequest("me-test@example.com", "Pass1234"));

        String accessToken = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        String token = objectMapper.readTree(accessToken).get("accessToken").asText();

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("me-test@example.com"));
    }

    @Test
    @DisplayName("GET /api/auth/me: トークンなし → 401")
    void getMe_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/auth/me: 不正なトークン → 401")
    void getMe_invalidToken_returns401() throws Exception {
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid.token.here"))
                .andExpect(status().isUnauthorized());
    }
}
