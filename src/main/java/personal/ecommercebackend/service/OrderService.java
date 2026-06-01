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

public interface OrderService {
    PaymentConfigResponse paymentConfig();
    CheckoutInitResponse initiateCheckout(CheckoutRequest request);
    CheckoutInitResponse updateCheckout(Long orderId, CheckoutRequest request);
    OrderResponse confirmPayment(Long orderId);
    void fulfillByPaymentIntentId(String paymentIntentId);
    OrderResponse cancelOrder(Long orderId);
    PageResponse<OrderResponse> myOrders(Pageable pageable);
    PageResponse<OrderResponse> allOrders(Pageable pageable);
    OrderResponse findById(Long id);
    OrderResponse updateStatus(Long id, OrderStatusUpdateRequest request);
    OrderResponse refundOrder(Long id, RefundRequest request);
    int cancelAbandonedOrders();
}
