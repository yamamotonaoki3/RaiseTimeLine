package com.raisetimeline.api.auth;

import com.raisetimeline.api.auth.refreshtoken.RefreshTokenService;
import com.raisetimeline.api.exception.DuplicateDisplayNameException;
import com.raisetimeline.api.exception.DuplicateEmailException;
import com.raisetimeline.api.exception.DuplicateUsernameException;
import com.raisetimeline.api.security.JwtUtil;
import com.raisetimeline.api.user.User;
import com.raisetimeline.api.user.UserMapper;
import java.util.Optional;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            UserMapper userMapper,
            PasswordEncoder passwordEncoder,
            RefreshTokenService refreshTokenService) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenService = refreshTokenService;
    }

    public TokenPair register(RegisterRequest request) {
        if (userMapper.findByEmail(request.email()).isPresent()) {
            throw new DuplicateEmailException("このメールアドレスは既に使用されています");
        }
        if (userMapper.findByUsername(request.username()).isPresent()) {
            throw new DuplicateUsernameException("このユーザー名は既に使用されています");
        }
        if (userMapper.findByDisplayName(request.displayName()).isPresent()) {
            throw new DuplicateDisplayNameException("この表示名は既に使用されています");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setUsername(request.username());
        user.setDisplayName(request.displayName());
        userMapper.insert(user);

        String accessToken = jwtUtil.generateAccessToken(user.getEmail());
        String refreshToken = refreshTokenService.create(user.getId());
        AuthResponse response = new AuthResponse(accessToken, user.getId(), user.getDisplayName(), user.getEmail());
        return new TokenPair(response, refreshToken);
    }

    public TokenPair login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        User user = userMapper.findByEmail(request.email()).orElseThrow();
        String accessToken = jwtUtil.generateAccessToken(user.getEmail());
        String refreshToken = refreshTokenService.create(user.getId());
        AuthResponse response = new AuthResponse(accessToken, user.getId(), user.getDisplayName(), user.getEmail());
        return new TokenPair(response, refreshToken);
    }

    public String refresh(String refreshToken) {
        User user = refreshTokenService.validate(refreshToken);
        refreshTokenService.delete(refreshToken);
        refreshTokenService.create(user.getId());
        return jwtUtil.generateAccessToken(user.getEmail());
    }

    public void logout(String refreshToken) {
        if (refreshToken != null) {
            refreshTokenService.delete(refreshToken);
        }
    }

    public Optional<MeResponse> getCurrentUser(String email) {
        return userMapper.findByEmail(email)
                .map(u -> new MeResponse(u.getId(), u.getDisplayName(), u.getEmail(),
                        u.getAvatarUrl(), u.getBio()));
    }
}
