package com.stockflow.auth;

import com.stockflow.exception.DuplicateResourceException;
import com.stockflow.security.JwtTokenService;
import com.stockflow.user.Role;
import com.stockflow.user.User;
import com.stockflow.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenService jwtTokenService;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User("Jane Doe", "jane@stockflow.com", "encodedPassword", Role.EMPLOYEE);
        testUser.setId(10L);
    }

    @Test
    @DisplayName("Public registration always creates account with Role.EMPLOYEE")
    void testRegister_AlwaysCreatesEmployee() {
        RegisterRequest request = new RegisterRequest("Jane Doe", "jane@stockflow.com", "password123");

        when(userRepository.existsByEmail("jane@stockflow.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(10L);
            return u;
        });
        when(jwtTokenService.generateToken(any(User.class))).thenReturn("mock-jwt-token");
        when(jwtTokenService.getExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.user().role()).isEqualTo(Role.EMPLOYEE);
        assertThat(response.user().email()).isEqualTo("jane@stockflow.com");
        assertThat(response.token()).isEqualTo("mock-jwt-token");
    }

    @Test
    @DisplayName("Registration rejects duplicate email")
    void testRegister_DuplicateEmail_ThrowsException() {
        RegisterRequest request = new RegisterRequest("Jane Doe", "jane@stockflow.com", "password123");

        when(userRepository.existsByEmail("jane@stockflow.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("email");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Login succeeds with valid credentials")
    void testLogin_Success() {
        LoginRequest request = new LoginRequest("jane@stockflow.com", "password123");

        when(userRepository.findByEmail("jane@stockflow.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("password123", "encodedPassword")).thenReturn(true);
        when(jwtTokenService.generateToken(testUser)).thenReturn("valid-jwt-token");
        when(jwtTokenService.getExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.login(request);

        assertThat(response.token()).isEqualTo("valid-jwt-token");
        assertThat(response.user().email()).isEqualTo("jane@stockflow.com");
    }

    @Test
    @DisplayName("Login fails with invalid password")
    void testLogin_InvalidPassword_ThrowsBadCredentialsException() {
        LoginRequest request = new LoginRequest("jane@stockflow.com", "wrongPassword");

        when(userRepository.findByEmail("jane@stockflow.com")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("wrongPassword", "encodedPassword")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid email or password");
    }
}
