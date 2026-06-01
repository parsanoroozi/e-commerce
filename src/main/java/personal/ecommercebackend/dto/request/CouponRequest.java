package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;

public record CouponRequest(
        @NotBlank String code,
        BigDecimal discountPercent,
        BigDecimal discountAmount,
        BigDecimal minOrderAmount,
        Instant expiresAt,
        Integer usageLimit,
        Integer perUserUsageLimit,
        Boolean freeShipping,
        Set<Long> productIds,
        Set<Long> categoryIds,
        Boolean active
) {}
