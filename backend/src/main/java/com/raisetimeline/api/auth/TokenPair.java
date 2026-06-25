package com.raisetimeline.api.auth;

public record TokenPair(AuthResponse authResponse, String refreshToken) {
}
