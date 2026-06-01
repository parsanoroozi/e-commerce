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
import java.util.concurrent.CompletableFuture;

public interface EmailService {
    CompletableFuture<Boolean> sendOrderConfirmation(Order order, User user);
    CompletableFuture<Boolean> sendOrderShipped(Order order, User user);
    CompletableFuture<Boolean> sendPasswordReset(User user, String resetLink);
    CompletableFuture<Boolean> sendEmailVerificationCode(String email, String code);
    CompletableFuture<Boolean> sendAdminTwoFactorCode(User user, String code);
}
