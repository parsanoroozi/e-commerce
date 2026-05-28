package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;

public record CheckoutInitResponse(
        Long orderId,
        String clientSecret,
        String publishableKey,
        BigDecimal totalAmount,
        boolean devMode
) {}
