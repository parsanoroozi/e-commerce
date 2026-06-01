package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;

public record CouponValidateResponse(
        boolean valid,
        BigDecimal discountAmount,
        boolean freeShipping,
        String message
) {}
