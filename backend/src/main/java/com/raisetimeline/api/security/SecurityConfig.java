package com.raisetimeline.api.security;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;

    /**
     * CORS で許可するオリジン。application.yml の app.cors.allowed-origins で設定する。
     *
     * 開発用の Vite（5173）だけでなく、本番ビルド成果物を配信する vite preview（4183）も
     * 許可する必要がある。ここを決め打ちにしていると、preview に対する
     * ブラウザパフォーマンステストで /api/auth/refresh が 403 になり、
     * ログイン状態を復元できない。
     */
    private final List<String> allowedOrigins;

    /**
     * API仕様（springdoc）を公開するか。プロファイルごとの設定に追従する。
     *
     * 本番（application-prod.yml）では false にしている。そのとき、ここで認証を免除したままだと
     * ハンドラが存在しないパスだけが素通りし、500 を返す不格好な状態になる。
     * 公開しないなら認証免除もしない、と揃えることで、他の未知のパスと同じ 401 になる。
     */
    private final boolean apiDocsEnabled;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthFilter,
            CustomUserDetailsService userDetailsService,
            @Value("${app.cors.allowed-origins}") List<String> allowedOrigins,
            @Value("${springdoc.api-docs.enabled:true}") boolean apiDocsEnabled) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
        this.allowedOrigins = allowedOrigins;
        this.apiDocsEnabled = apiDocsEnabled;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        if (apiDocsEnabled) {
            http.authorizeHttpRequests(auth -> auth
                    .requestMatchers("/v3/api-docs/**", "/swagger-ui/**",
                            "/swagger-ui.html").permitAll());
        }

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(unauthorizedEntryPoint()))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/register", "/api/auth/login",
                                "/api/auth/refresh", "/api/auth/logout").permitAll()
                        .requestMatchers("/avatars/**").permitAll()
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationEntryPoint unauthorizedEntryPoint() {
        return (request, response, authException) ->
                response.sendError(HttpStatus.UNAUTHORIZED.value(), "Unauthorized");
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(allowedOrigins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
