package com.stockflow.auth;

import com.stockflow.user.UserResponse;

public record AuthResponse(
    String token,
    String tokenType,
    long expiresIn,
    UserResponse user
) {
    public AuthResponse(String token, long expiresIn, UserResponse user) {
        this(token, "Bearer", expiresIn, user);
    }
}
