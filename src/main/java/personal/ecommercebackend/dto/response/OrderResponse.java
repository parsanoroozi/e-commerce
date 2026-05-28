package personal.ecommercebackend.dto.response;

import personal.ecommercebackend.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record OrderResponse(
        Long id,
        OrderStatus status,
        BigDecimal totalAmount,
        String shippingStreet,
        String shippingCity,
        String shippingZipCode,
        String shippingCountry,
        Instant createdAt,
        List<OrderItemResponse> items,
        UserResponse customer
) {}
