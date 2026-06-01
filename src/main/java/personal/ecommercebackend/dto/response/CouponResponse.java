package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Set;

public record CouponResponse(
        Long id,
        String code,
        BigDecimal discountPercent,
        BigDecimal discountAmount,
        BigDecimal minOrderAmount,
        Instant expiresAt,
        Integer usageLimit,
        Integer perUserUsageLimit,
        boolean freeShipping,
        Set<Long> productIds,
        Set<Long> categoryIds,
        long usageCount,
        long uniqueCustomerCount,
        BigDecimal revenueAttributed,
        boolean active
) {}
