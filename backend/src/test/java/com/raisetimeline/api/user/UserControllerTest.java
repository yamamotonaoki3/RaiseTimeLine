package com.raisetimeline.api.user;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.raisetimeline.api.auth.LoginRequest;
import com.raisetimeline.api.auth.RegisterRequest;
import com.raisetimeline.api.post.S3PostImageService;
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
class UserControllerTest {

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

        String email = "user-ctrl-" + System.nanoTime() + "@example.com";
        String username = "user_ctrl_" + (System.nanoTime() % 100000);
        String displayName = "ユーザーCtrl" + System.nanoTime();

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

    // --- GET /api/users/search 同値分割 ---

    @Test
    @DisplayName("GET /api/users/search: q あり（有効クラス）→ 200")
    void search_validQuery_returns200() throws Exception {
        mockMvc.perform(get("/api/users/search")
                        .param("q", "テスト")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("GET /api/users/search: q が空（無効クラス）→ 400")
    void search_emptyQuery_returns400() throws Exception {
        mockMvc.perform(get("/api/users/search")
                        .param("q", "")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/users/search: q パラメータなし（無効クラス）→ 400")
    void search_noQuery_returns400() throws Exception {
        mockMvc.perform(get("/api/users/search")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/users/search: 認証なし（無効クラス）→ 401")
    void search_noToken_returns401() throws Exception {
        mockMvc.perform(get("/api/users/search")
                        .param("q", "テスト"))
                .andExpect(status().isUnauthorized());
    }
}
