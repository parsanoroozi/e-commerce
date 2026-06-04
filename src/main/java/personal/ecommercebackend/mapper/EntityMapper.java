package personal.ecommercebackend.mapper;

import personal.ecommercebackend.dto.response.*;
import personal.ecommercebackend.entity.*;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public final class EntityMapper {

    private EntityMapper() {}

    public static UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getMobileNumber(),
                user.getRole(),
                user.isBlocked(),
                user.isTwoFactorEnabled(),
                user.getCustomerSegment()
        );
    }

    public static CategoryResponse toCategoryResponse(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getDisplayOrder(),
                category.getParent() == null ? null : category.getParent().getId(),
                category.getParent() == null ? null : category.getParent().getName(),
                category.getLowStockThreshold(),
                category.getTaxRate(),
                category.getVariantOptions() == null ? List.of() : category.getVariantOptions().stream()
                        .map(option -> new CategoryVariantOptionResponse(
                                option.getName(),
                                option.getDisplayOrder()))
                        .toList());
    }

    public static ProductResponse toProductResponse(Product product) {
        return toProductResponse(product, null, null);
    }

    public static ProductResponse toProductResponse(Product product, Double avgRating, Long reviewCount) {
        List<ProductImageResponse> imageDetails = product.getImages() == null
                ? List.of()
                : product.getImages().stream()
                .map(EntityMapper::toProductImageResponse)
                .toList();
        List<String> images = new ArrayList<>(imageDetails.stream()
                .map(ProductImageResponse::url)
                .toList());
        String primaryImage = imageDetails.stream()
                .filter(ProductImageResponse::primaryImage)
                .findFirst()
                .map(ProductImageResponse::url)
                .orElse(product.getImageUrl());
        if (primaryImage == null && !images.isEmpty()) {
            primaryImage = images.get(0);
        }
        if (product.getImageUrl() != null && !product.getImageUrl().isBlank() && !images.contains(product.getImageUrl())) {
            images.add(0, product.getImageUrl());
        }
        List<ProductVariantResponse> variants = product.getVariants() == null
                ? List.of()
                : product.getVariants().stream()
                .map(EntityMapper::toProductVariantResponse)
                .toList();
        int stockQuantity = variants.isEmpty()
                ? product.getStockQuantity()
                : variants.stream()
                .filter(ProductVariantResponse::active)
                .mapToInt(ProductVariantResponse::stockQuantity)
                .sum();

        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getTaxRate(),
                product.getSku(),
                product.getSlug(),
                product.getMetaTitle(),
                product.getMetaDescription(),
                stockQuantity,
                primaryImage,
                images,
                imageDetails,
                variants,
                product.getCategory().getId(),
                product.getCategory().getName(),
                product.getCategory().getLowStockThreshold(),
                product.isActive(),
                product.isFeatured(),
                product.getVisibleFrom(),
                product.getVisibleUntil(),
                avgRating,
                reviewCount
        );
    }

    public static ProductImageResponse toProductImageResponse(ProductImage image) {
        return new ProductImageResponse(
                image.getId(),
                image.getUrl(),
                image.getAltText(),
                image.getSortOrder(),
                image.isPrimaryImage());
    }

    public static ProductVariantResponse toProductVariantResponse(ProductVariant variant) {
        return new ProductVariantResponse(
                variant.getId(),
                variant.getSku(),
                variant.getAttributes(),
                variant.getStockQuantity(),
                variant.isActive(),
                variant.displayName()
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
                item.getId(),
                item.getProduct().getId(),
                item.getVariant() == null ? null : item.getVariant().getId(),
                item.getProduct().getName(),
                item.getVariant() == null ? null : item.getVariant().displayName(),
                item.getVariant() != null && item.getVariant().getSku() != null
                        ? item.getVariant().getSku()
                        : item.getProduct().getSku(),
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
        List<OrderTimelineEventResponse> staffTimeline = includeCustomer
                ? order.getTimelineEvents().stream()
                .map(EntityMapper::toOrderTimelineEventResponse)
                .toList()
                : List.of();
        BigDecimal refundedAmount = order.getRefundedAmount() != null ? order.getRefundedAmount() : BigDecimal.ZERO;
        BigDecimal refundableAmount = order.getTotalAmount() == null
                ? BigDecimal.ZERO
                : order.getTotalAmount().subtract(refundedAmount).max(BigDecimal.ZERO);
        List<RefundResponse> refunds = order.getRefunds() == null
                ? List.of()
                : order.getRefunds().stream()
                .map(refund -> toRefundResponse(refund, includeCustomer))
                .toList();
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
                order.getShippingState(),
                order.getShippingZipCode(),
                order.getShippingCountry(),
                order.getShippingLatitude(),
                order.getShippingLongitude(),
                order.getTrackingNumber(),
                order.getShippingCarrier(),
                trackingUrl(order.getShippingCarrier(), order.getTrackingNumber()),
                includeCustomer ? order.getAdminNotes() : null,
                order.getPackedAt(),
                order.getShippedAt(),
                order.getDeliveredAt(),
                includeCustomer ? order.isShipmentEmailSent() : null,
                refundedAmount,
                refundableAmount,
                refunds,
                order.getCreatedAt(),
                items,
                staffTimeline,
                customer
        );
    }

    public static OrderTimelineEventResponse toOrderTimelineEventResponse(OrderTimelineEvent event) {
        return new OrderTimelineEventResponse(
                event.getId(),
                event.getAction(),
                event.getFromStatus(),
                event.getToStatus(),
                event.getShippingCarrier(),
                event.getTrackingNumber(),
                event.getNote(),
                event.getAdminUser() == null ? null : event.getAdminUser().getEmail(),
                event.getCreatedAt()
        );
    }

    public static RefundResponse toRefundResponse(OrderRefund refund, boolean includeAdmin) {
        return new RefundResponse(
                refund.getId(),
                refund.getAmount(),
                refund.getReason(),
                refund.getStatus(),
                refund.getProviderRefundId(),
                refund.getProviderMessage(),
                includeAdmin && refund.getAdminUser() != null ? refund.getAdminUser().getEmail() : null,
                refund.getCreatedAt()
        );
    }

    public static OrderItemResponse toOrderItemResponse(OrderItem item) {
        BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
        return new OrderItemResponse(
                item.getProduct().getId(),
                item.getVariant() == null ? null : item.getVariant().getId(),
                item.getProductName(),
                item.getVariantName(),
                item.getSku(),
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
        return toCouponResponse(coupon, 0, 0, BigDecimal.ZERO);
    }

    public static CouponResponse toCouponResponse(Coupon coupon, long usageCount, long uniqueCustomerCount, BigDecimal revenueAttributed) {
        return new CouponResponse(
                coupon.getId(),
                coupon.getCode(),
                coupon.getDiscountPercent(),
                coupon.getDiscountAmount(),
                coupon.getMinOrderAmount(),
                coupon.getExpiresAt(),
                coupon.getUsageLimit(),
                coupon.getPerUserUsageLimit(),
                coupon.isFreeShipping(),
                coupon.getProductIds() == null ? Set.of() : Set.copyOf(coupon.getProductIds()),
                coupon.getCategoryIds() == null ? Set.of() : Set.copyOf(coupon.getCategoryIds()),
                usageCount,
                uniqueCustomerCount,
                revenueAttributed,
                coupon.isActive()
        );
    }

    private static String trackingUrl(String carrier, String trackingNumber) {
        if (trackingNumber == null || trackingNumber.isBlank()) {
            return null;
        }
        String encoded = trackingNumber.trim().replace(" ", "%20");
        String normalizedCarrier = carrier == null ? "" : carrier.trim().toLowerCase();
        if (normalizedCarrier.contains("ups")) {
            return "https://www.ups.com/track?tracknum=" + encoded;
        }
        if (normalizedCarrier.contains("fedex")) {
            return "https://www.fedex.com/fedextrack/?trknbr=" + encoded;
        }
        if (normalizedCarrier.contains("dhl")) {
            return "https://www.dhl.com/global-en/home/tracking.html?tracking-id=" + encoded;
        }
        if (normalizedCarrier.contains("usps")) {
            return "https://tools.usps.com/go/TrackConfirmAction?tLabels=" + encoded;
        }
        return "https://www.google.com/search?q=" + encoded + "%20tracking";
    }
}
