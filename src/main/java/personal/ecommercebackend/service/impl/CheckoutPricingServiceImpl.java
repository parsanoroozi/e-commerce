package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import personal.ecommercebackend.dto.CheckoutTotals;
import personal.ecommercebackend.dto.response.AdminSettingsResponse;
import personal.ecommercebackend.entity.CartItem;
import personal.ecommercebackend.entity.Coupon;
import personal.ecommercebackend.entity.ShippingMethod;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.repository.CouponRepository;
import personal.ecommercebackend.repository.OrderRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CheckoutPricingServiceImpl implements CheckoutPricingService {

    private final CouponRepository couponRepository;
    private final OrderRepository orderRepository;
    private final ShopSettingsService shopSettingsService;

    @Value("${app.tax.rate:0.08}")
    private BigDecimal taxRate;

    public CheckoutTotals calculate(BigDecimal subtotal, String couponCode, ShippingMethod shippingMethod) {
        return calculate(subtotal, couponCode, shippingMethod, null, List.of());
    }

    public CheckoutTotals calculate(BigDecimal subtotal, String couponCode, ShippingMethod shippingMethod, Long userId, List<CartItem> items) {
        Coupon coupon = resolveCoupon(subtotal, couponCode, userId, items);
        BigDecimal discount = resolveDiscount(subtotal, coupon);
        BigDecimal afterDiscount = subtotal.subtract(discount).max(BigDecimal.ZERO);
        AdminSettingsResponse settings = shopSettingsService.getSettings();
        BigDecimal shipping = coupon != null && coupon.isFreeShipping()
                ? BigDecimal.ZERO
                : resolveShippingCost(shippingMethod, settings);
        BigDecimal taxable = afterDiscount.add(shipping);
        BigDecimal tax = taxable.multiply(settings.taxRate() == null ? taxRate : settings.taxRate()).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = afterDiscount.add(shipping).add(tax).setScale(2, RoundingMode.HALF_UP);

        return new CheckoutTotals(subtotal, discount, shipping, tax, total,
                coupon == null ? null : coupon.getCode(), coupon != null && coupon.isFreeShipping());
    }

    public BigDecimal previewDiscount(BigDecimal subtotal, String couponCode) {
        return previewDiscount(subtotal, couponCode, null, List.of());
    }

    public BigDecimal previewDiscount(BigDecimal subtotal, String couponCode, Long userId, List<CartItem> items) {
        return resolveDiscount(subtotal, resolveCoupon(subtotal, couponCode, userId, items));
    }

    private Coupon resolveCoupon(BigDecimal subtotal, String couponCode, Long userId, List<CartItem> items) {
        if (couponCode == null || couponCode.isBlank()) {
            return null;
        }
        Coupon coupon = couponRepository.findByCodeIgnoreCase(couponCode.trim())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid coupon code"));

        if (!coupon.isActive()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Coupon is not active");
        }
        if (coupon.getExpiresAt() != null && coupon.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Coupon has expired");
        }
        if (coupon.getMinOrderAmount() != null && subtotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Minimum order amount is $" + coupon.getMinOrderAmount());
        }
        if (coupon.getUsageLimit() != null
                && orderRepository.countByCouponCodeIgnoreCase(coupon.getCode()) >= coupon.getUsageLimit()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Coupon usage limit reached");
        }
        if (userId != null && coupon.getPerUserUsageLimit() != null
                && orderRepository.countByCouponCodeIgnoreCaseAndUserId(coupon.getCode(), userId) >= coupon.getPerUserUsageLimit()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You have already used this coupon");
        }
        if (!coupon.getProductIds().isEmpty() || !coupon.getCategoryIds().isEmpty()) {
            boolean matches = items != null && items.stream().anyMatch(item ->
                    coupon.getProductIds().contains(item.getProduct().getId())
                            || (item.getProduct().getCategory() != null
                            && coupon.getCategoryIds().contains(item.getProduct().getCategory().getId())));
            if (!matches) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Coupon does not apply to items in your cart");
            }
        }
        return coupon;
    }

    private BigDecimal resolveDiscount(BigDecimal subtotal, Coupon coupon) {
        if (coupon == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal discount = BigDecimal.ZERO;
        if (coupon.getDiscountPercent() != null) {
            discount = subtotal.multiply(coupon.getDiscountPercent())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else if (coupon.getDiscountAmount() != null) {
            discount = coupon.getDiscountAmount();
        }
        return discount.min(subtotal);
    }

    private BigDecimal resolveShippingCost(ShippingMethod shippingMethod, AdminSettingsResponse settings) {
        ShippingMethod method = shippingMethod == null ? ShippingMethod.STANDARD : shippingMethod;
        return method == ShippingMethod.EXPRESS
                ? settings.expressShippingCost()
                : settings.standardShippingCost();
    }
}
