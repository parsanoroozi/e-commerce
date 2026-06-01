package personal.ecommercebackend.dto.response;

import personal.ecommercebackend.entity.RefundStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record RefundResponse(
        Long id,
        BigDecimal amount,
        String reason,
        RefundStatus status,
        String providerRefundId,
        String providerMessage,
        String adminEmail,
        Instant createdAt
) {}
