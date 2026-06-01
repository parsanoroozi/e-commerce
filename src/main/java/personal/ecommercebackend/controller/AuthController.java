package personal.ecommercebackend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import personal.ecommercebackend.dto.request.*;
import personal.ecommercebackend.dto.response.AuthResponse;
import personal.ecommercebackend.dto.response.UserResponse;
import personal.ecommercebackend.service.AuthService;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${app.auth.cookie.name:SHOPVERSE_AUTH}")
    private String authCookieName;

    @Value("${app.auth.cookie.secure:false}")
    private boolean authCookieSecure;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    @PostMapping("/email-verification")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void sendEmailVerification(@Valid @RequestBody EmailVerificationRequest request) {
        authService.sendEmailVerification(request);
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        AuthResponse response = authService.register(request, userAgent(httpRequest), ipAddress(httpRequest));
        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.SET_COOKIE, createAuthCookie(response.token()).toString())
                .body(cookieOnlyResponse(response));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        AuthResponse response = authService.login(request, userAgent(httpRequest), ipAddress(httpRequest));
        if (response.requiresTwoFactor()) {
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, createAuthCookie(response.token()).toString())
                .body(cookieOnlyResponse(response));
    }

    @PostMapping("/login/2fa")
    public ResponseEntity<AuthResponse> verifyTwoFactor(
            @Valid @RequestBody TwoFactorLoginRequest request,
            HttpServletRequest httpRequest) {
        AuthResponse response = authService.verifyTwoFactor(request, userAgent(httpRequest), ipAddress(httpRequest));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, createAuthCookie(response.token()).toString())
                .body(cookieOnlyResponse(response));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        authService.logout(resolveToken(request));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearAuthCookie().toString())
                .build();
    }

    @GetMapping("/me")
    public UserResponse me() {
        return authService.me();
    }

    @GetMapping("/sessions")
    public java.util.List<personal.ecommercebackend.dto.response.SessionResponse> sessions(HttpServletRequest request) {
        return authService.sessions(resolveToken(request));
    }

    @DeleteMapping("/sessions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revokeSession(@PathVariable Long id) {
        authService.revokeSession(id);
    }

    @PatchMapping("/2fa")
    public UserResponse updateTwoFactor(@RequestBody TwoFactorSettingsRequest request) {
        return authService.updateTwoFactor(request);
    }

    @PatchMapping("/profile")
    public UserResponse updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        return authService.updateProfile(request);
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(request);
    }

    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
    }

    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
    }

    private ResponseCookie createAuthCookie(String token) {
        return ResponseCookie.from(authCookieName, token)
                .httpOnly(true)
                .secure(authCookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ofMillis(jwtExpirationMs))
                .build();
    }

    private ResponseCookie clearAuthCookie() {
        return ResponseCookie.from(authCookieName, "")
                .httpOnly(true)
                .secure(authCookieSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
    }

    private AuthResponse cookieOnlyResponse(AuthResponse response) {
        return new AuthResponse(null, response.user(), false, null);
    }

    private String resolveToken(HttpServletRequest request) {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (authCookieName.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    private String userAgent(HttpServletRequest request) {
        return request.getHeader(HttpHeaders.USER_AGENT);
    }

    private String ipAddress(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        return forwarded == null || forwarded.isBlank()
                ? request.getRemoteAddr()
                : forwarded.split(",")[0].trim();
    }
}
