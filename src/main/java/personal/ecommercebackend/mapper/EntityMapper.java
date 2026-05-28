package personal.ecommercebackend.mapper;

import personal.ecommercebackend.dto.response.*;
import personal.ecommercebackend.entity.*;

import java.math.BigDecimal;
import java.util.List;

public final class EntityMapper {

    private EntityMapper() {}

    public static UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole()
        );
    }

    public static CategoryResponse toCategoryResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getDescription());
    }

    public static ProductResponse toProductResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStockQuantity(),
                product.getImageUrl(),
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.isActive()
        );
    }

    public static CartResponse toCartResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
                .map(EntityMapper::toCartItemResponse)
                .toList();
        BigDecimal total = items.stream()
                .map(CartItemResponse::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        int count = items.stream().mapToInt(CartItemResponse::quantity).sum();
        return new CartResponse(items, total, count);
    }

    public static CartItemResponse toCartItemResponse(CartItem item) {
        BigDecimal lineTotal = item.getProduct().getPrice()
                .multiply(BigDecimal.valueOf(item.getQuantity()));
        return new CartItemResponse(
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getProduct().getImageUrl(),
                item.getProduct().getPrice(),
                item.getQuantity(),
                lineTotal
        );
    }

    public static OrderResponse toOrderResponse(Order order, boolean includeCustomer) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(EntityMapper::toOrderItemResponse)
                .toList();
        UserResponse customer = includeCustomer ? toUserResponse(order.getUser()) : null;
        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getTotalAmount(),
                order.getShippingStreet(),
                order.getShippingCity(),
                order.getShippingZipCode(),
                order.getShippingCountry(),
                order.getCreatedAt(),
                items,
                customer
        );
    }

    public static OrderItemResponse toOrderItemResponse(OrderItem item) {
        BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
        return new OrderItemResponse(
                item.getProduct().getId(),
                item.getProductName(),
                item.getQuantity(),
                item.getUnitPrice(),
                lineTotal
        );
    }
}
