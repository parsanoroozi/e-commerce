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
        String shippingZipCode,
        String shippingCountry,
        Double shippingLatitude,
        Double shippingLongitude,
        Instant createdAt,
        List<OrderItemResponse> items,
        UserResponse customer
) {}
