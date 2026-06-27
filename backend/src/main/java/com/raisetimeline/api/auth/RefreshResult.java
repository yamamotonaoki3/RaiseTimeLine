package com.raisetimeline.api.auth;

public record RefreshResult(RefreshResponse response, String newRefreshToken) {
}
