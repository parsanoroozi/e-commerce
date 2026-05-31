package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.request.*;
import personal.ecommercebackend.dto.response.AuthResponse;
import personal.ecommercebackend.dto.response.UserResponse;
import personal.ecommercebackend.entity.Cart;
import personal.ecommercebackend.entity.EmailVerificationCode;
import personal.ecommercebackend.entity.Role;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.entity.PasswordResetToken;
import personal.ecommercebackend.repository.EmailVerificationCodeRepository;
import personal.ecommercebackend.repository.PasswordResetTokenRepository;
import personal.ecommercebackend.repository.UserRepository;
import personal.ecommercebackend.security.JwtService;
import personal.ecommercebackend.security.SecurityUtils;
import personal.ecommercebackend.security.UserPrincipal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.concurrent.ThreadLocalRandom;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final EmailVerificationCodeRepository emailVerificationCodeRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Transactional
    public void sendEmailVerification(EmailVerificationRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }
        String code = String.valueOf(ThreadLocalRandom.current().nextInt(100000, 1000000));
        emailVerificationCodeRepository.save(EmailVerificationCode.builder()
                .email(email)
                .codeHash(hashToken(code))
                .expiresAt(Instant.now().plusSeconds(600))
                .used(false)
                .build());
        emailService.sendEmailVerificationCode(email, code);
        log.info("Email verification code sent email={}", email);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }
        verifyEmailCode(email, request.emailVerificationCode());

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.password()))
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .mobileNumber(normalizeOptional(request.mobileNumber()))
                .role(Role.CUSTOMER)
                .build();

        Cart cart = Cart.builder().user(user).build();
        user.setCart(cart);

        user = userRepository.save(user);
        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);
        log.info("User registered userId={} email={}", user.getId(), user.getEmail());
        return new AuthResponse(token, EntityMapper.toUserResponse(user));
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        normalizeEmail(request.email()),
                        request.password()));

        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);
        log.info("User logged in userId={} email={}", user.getId(), user.getEmail());
        return new AuthResponse(token, EntityMapper.toUserResponse(user));
    }

    @Transactional(readOnly = true)
    public UserResponse me() {
        User user = userRepository.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return EntityMapper.toUserResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(ProfileUpdateRequest request) {
        User user = userRepository.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setMobileNumber(normalizeOptional(request.mobileNumber()));
        log.info("User profile updated userId={}", user.getId());
        return EntityMapper.toUserResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = userRepository.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        log.info("Password changed userId={}", user.getId());
    }

    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(normalizeEmail(request.email())).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            passwordResetTokenRepository.save(PasswordResetToken.builder()
                    .user(user)
                    .token(hashToken(token))
                    .expiresAt(Instant.now().plusSeconds(3600))
                    .used(false)
                    .build());
            String baseUrl = frontendUrl.split(",")[0].trim();
            String resetLink = baseUrl + "/reset-password?token=" + token;
            emailService.sendPasswordReset(user, resetLink);
            log.info("Password reset requested userId={} email={}", user.getId(), user.getEmail());
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        PasswordResetToken token = passwordResetTokenRepository.findByToken(hashToken(request.token()))
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired token"));
        if (token.isUsed() || token.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid or expired token");
        }
        User user = token.getUser();
        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        token.setUsed(true);
        passwordResetTokenRepository.save(token);
        log.info("Password reset completed userId={}", user.getId());
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    private void verifyEmailCode(String email, String code) {
        EmailVerificationCode verification = emailVerificationCodeRepository
                .findTopByEmailAndUsedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Send a verification code first"));
        if (verification.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification code expired");
        }
        if (!verification.getCodeHash().equals(hashToken(code))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid verification code");
        }
        verification.setUsed(true);
        emailVerificationCodeRepository.save(verification);
    }

    private String normalizeEmail(String email) {
        return email.toLowerCase().trim();
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
