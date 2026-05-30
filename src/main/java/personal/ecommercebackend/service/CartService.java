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

public interface CartService {
    CartResponse getCart();
    CartSummaryResponse getSummary();
    CartResponse addItem(CartItemRequest request);
    CartResponse updateItem(Long productId, CartItemRequest request);
    CartResponse removeItem(Long productId);
    CartResponse clearCart();
}
