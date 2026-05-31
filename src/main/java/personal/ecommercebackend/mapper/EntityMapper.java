package personal.ecommercebackend.mapper;

import personal.ecommercebackend.dto.response.*;
import personal.ecommercebackend.entity.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public final class EntityMapper {

    private EntityMapper() {}

    public static UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getMobileNumber(),
                user.getRole()
        );
    }

    public static CategoryResponse toCategoryResponse(Category category) {
        return new CategoryResponse(category.getId(), category.getName(), category.getDescription());
    }

    public static ProductResponse toProductResponse(Product product) {
        return toProductResponse(product, null, null);
    }

    public static ProductResponse toProductResponse(Product product, Double avgRating, Long reviewCount) {
        List<String> images = new ArrayList<>();
        if (product.getImageUrl() != null && !product.getImageUrl().isBlank()) {
            images.add(product.getImageUrl());
        }
        if (product.getImages() != null) {
            product.getImages().forEach(img -> {
                if (!images.contains(img.getUrl())) {
                    images.add(img.getUrl());
                }
            });
        }
        String primaryImage = images.isEmpty() ? product.getImageUrl() : images.get(0);

        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStockQuantity(),
                primaryImage,
                images,
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.isActive(),
                avgRating,
                reviewCount
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
        BigDecimal subtotal = order.getSubtotalAmount() != null ? order.getSubtotalAmount() : order.getTotalAmount();
        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                subtotal,
                order.getDiscountAmount() != null ? order.getDiscountAmount() : BigDecimal.ZERO,
                order.getShippingCost() != null ? order.getShippingCost() : BigDecimal.ZERO,
                order.getTaxAmount() != null ? order.getTaxAmount() : BigDecimal.ZERO,
                order.getTotalAmount(),
                order.getCouponCode(),
                order.getShippingMethod(),
                order.getShippingStreet(),
                order.getShippingCity(),
                order.getShippingZipCode(),
                order.getShippingCountry(),
                order.getShippingLatitude(),
                order.getShippingLongitude(),
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

    public static ReviewResponse toReviewResponse(ProductReview review) {
        return new ReviewResponse(
                review.getId(),
                review.getProduct().getId(),
                review.getUser().getFirstName() + " " + review.getUser().getLastName().charAt(0) + ".",
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }

    public static CouponResponse toCouponResponse(Coupon coupon) {
        return new CouponResponse(
                coupon.getId(),
                coupon.getCode(),
                coupon.getDiscountPercent(),
                coupon.getDiscountAmount(),
                coupon.getMinOrderAmount(),
                coupon.getExpiresAt(),
                coupon.isActive()
        );
    }
}
