package personal.ecommercebackend.dto.response;

import personal.ecommercebackend.entity.OrderStatus;

import java.time.Instant;

public record OrderTimelineEventResponse(
        Long id,
        String action,
        OrderStatus fromStatus,
        OrderStatus toStatus,
        String shippingCarrier,
        String trackingNumber,
        String note,
        String adminEmail,
        Instant createdAt
) {}
