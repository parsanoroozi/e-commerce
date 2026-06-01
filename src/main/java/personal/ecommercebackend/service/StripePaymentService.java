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
import com.stripe.model.Refund;

import java.math.BigDecimal;

public interface StripePaymentService {
    PaymentIntent createPaymentIntent(Order order, User user);
    PaymentIntent updatePaymentIntentAmount(String paymentIntentId, BigDecimal amount);
    PaymentIntent retrievePaymentIntent(String paymentIntentId);
    Refund refundPayment(String paymentIntentId, BigDecimal amount, String reason);
    boolean isPaymentSucceeded(PaymentIntent intent);
    String publishableKey();
    boolean isConfigured();
}
