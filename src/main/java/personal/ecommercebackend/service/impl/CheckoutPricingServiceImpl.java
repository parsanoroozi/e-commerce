package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import personal.ecommercebackend.dto.CheckoutTotals;
import personal.ecommercebackend.entity.Coupon;
import personal.ecommercebackend.entity.ShippingMethod;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.repository.CouponRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class CheckoutPricingServiceImpl implements CheckoutPricingService {

    private final CouponRepository couponRepository;

    @Value("${app.tax.rate:0.08}")
    private BigDecimal taxRate;

    public CheckoutTotals calculate(BigDecimal subtotal, String couponCode, ShippingMethod shippingMethod) {
        BigDecimal discount = resolveDiscount(subtotal, couponCode);
        BigDecimal afterDiscount = subtotal.subtract(discount).max(BigDecimal.ZERO);
        BigDecimal shipping = shippingMethod != null ? shippingMethod.getPrice() : ShippingMethod.STANDARD.getPrice();
        BigDecimal taxable = afterDiscount.add(shipping);
        BigDecimal tax = taxable.multiply(taxRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = afterDiscount.add(shipping).add(tax).setScale(2, RoundingMode.HALF_UP);

        return new CheckoutTotals(subtotal, discount, shipping, tax, total, couponCode);
    }

    public BigDecimal previewDiscount(BigDecimal subtotal, String couponCode) {
        return resolveDiscount(subtotal, couponCode);
    }

    private BigDecimal resolveDiscount(BigDecimal subtotal, String couponCode) {
        if (couponCode == null || couponCode.isBlank()) {
            return BigDecimal.ZERO;
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

        BigDecimal discount = BigDecimal.ZERO;
        if (coupon.getDiscountPercent() != null) {
            discount = subtotal.multiply(coupon.getDiscountPercent())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else if (coupon.getDiscountAmount() != null) {
            discount = coupon.getDiscountAmount();
        }
        return discount.min(subtotal);
    }
}
