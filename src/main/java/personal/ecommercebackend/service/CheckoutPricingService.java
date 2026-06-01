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

public interface CheckoutPricingService {
    CheckoutTotals calculate(BigDecimal subtotal, String couponCode, ShippingMethod shippingMethod);
    CheckoutTotals calculate(BigDecimal subtotal, String couponCode, ShippingMethod shippingMethod, Long userId, List<CartItem> items);
    BigDecimal previewDiscount(BigDecimal subtotal, String couponCode);
    BigDecimal previewDiscount(BigDecimal subtotal, String couponCode, Long userId, List<CartItem> items);
}
