package personal.ecommercebackend.service;

import org.springframework.data.domain.Pageable;
import personal.ecommercebackend.dto.request.*;
import personal.ecommercebackend.dto.response.*;
import personal.ecommercebackend.dto.*;
import personal.ecommercebackend.entity.*;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import com.stripe.model.PaymentIntent;

public interface AuthService {
    void sendEmailVerification(EmailVerificationRequest request);
    AuthResponse register(RegisterRequest request, String userAgent, String ipAddress);
    AuthResponse login(LoginRequest request, String userAgent, String ipAddress);
    AuthResponse verifyTwoFactor(TwoFactorLoginRequest request, String userAgent, String ipAddress);
    void logout(String token);
    List<SessionResponse> sessions(String currentToken);
    void revokeSession(Long sessionId);
    UserResponse updateTwoFactor(TwoFactorSettingsRequest request);
    UserResponse me();
    UserResponse updateProfile(ProfileUpdateRequest request);
    void changePassword(ChangePasswordRequest request);
    void forgotPassword(ForgotPasswordRequest request);
    void resetPassword(ResetPasswordRequest request);
}
