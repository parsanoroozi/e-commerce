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

public interface EmailService {
    void sendOrderConfirmation(Order order, User user);
    void sendOrderShipped(Order order, User user);
    void sendPasswordReset(User user, String resetLink);
    void sendEmailVerificationCode(String email, String code);
}
