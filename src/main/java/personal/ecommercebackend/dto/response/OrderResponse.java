package personal.ecommercebackend.dto.response;

import personal.ecommercebackend.entity.OrderStatus;
import personal.ecommercebackend.entity.ShippingMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        OrderStatus status,
        BigDecimal subtotalAmount,
        BigDecimal discountAmount,
        BigDecimal shippingCost,
        BigDecimal taxAmount,
        BigDecimal totalAmount,
        String couponCode,
        ShippingMethod shippingMethod,
        String shippingStreet,
        String shippingCity,
        String shippingState,
        String shippingZipCode,
        String shippingCountry,
        Double shippingLatitude,
        Double shippingLongitude,
        String trackingNumber,
        String shippingCarrier,
        String trackingUrl,
        String adminNotes,
        Instant packedAt,
        Instant shippedAt,
        Instant deliveredAt,
        Boolean shipmentEmailSent,
        BigDecimal refundedAmount,
        BigDecimal refundableAmount,
        List<RefundResponse> refunds,
        Instant createdAt,
        List<OrderItemResponse> items,
        List<OrderTimelineEventResponse> staffTimeline,
        UserResponse customer
) {}
