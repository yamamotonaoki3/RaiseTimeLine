package com.raisetimeline.api.auth;

import com.raisetimeline.api.exception.DuplicateDisplayNameException;
import com.raisetimeline.api.exception.DuplicateEmailException;
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

    public AuthService(
            AuthenticationManager authenticationManager,
            JwtUtil jwtUtil,
            UserMapper userMapper,
            PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.jwtUtil = jwtUtil;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userMapper.findByEmail(request.email()).isPresent()) {
            throw new DuplicateEmailException("このメールアドレスは既に使用されています");
        }
        if (userMapper.findByDisplayName(request.displayName()).isPresent()) {
            throw new DuplicateDisplayNameException("この表示名は既に使用されています");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.displayName());
        userMapper.insert(user);

        String token = jwtUtil.generateToken(request.email());
        return new AuthResponse(token, user.getId(), user.getDisplayName(), user.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );
        User user = userMapper.findByEmail(request.email()).orElseThrow();
        String token = jwtUtil.generateToken(request.email());
        return new AuthResponse(token, user.getId(), user.getDisplayName(), user.getEmail());
    }

    public Optional<MeResponse> getCurrentUser(String email) {
        return userMapper.findByEmail(email)
                .map(u -> new MeResponse(u.getId(), u.getDisplayName(), u.getEmail(),
                        u.getAvatarUrl(), u.getBio()));
    }
}
