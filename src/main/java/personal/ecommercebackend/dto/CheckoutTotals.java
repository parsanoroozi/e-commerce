package personal.ecommercebackend.dto;

import java.math.BigDecimal;

public record CheckoutTotals(
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal shipping,
        BigDecimal tax,
        BigDecimal total,
        String couponCode
) {}
