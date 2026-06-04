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
import personal.ecommercebackend.entity.Category;
import personal.ecommercebackend.entity.OrderItem;
import personal.ecommercebackend.entity.Product;
import personal.ecommercebackend.entity.ShippingMethod;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.repository.CouponRepository;
import personal.ecommercebackend.repository.OrderRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;

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
        return calculate(subtotal, couponCode, shippingMethod, userId, items, null, null);
    }

    public CheckoutTotals calculate(BigDecimal subtotal, String couponCode, ShippingMethod shippingMethod, Long userId, List<CartItem> items,
                                    String shippingState, String shippingCountry) {
        Coupon coupon = resolveCoupon(subtotal, couponCode, userId, items);
        BigDecimal discount = resolveDiscount(subtotal, coupon);
        BigDecimal afterDiscount = subtotal.subtract(discount).max(BigDecimal.ZERO);
        AdminSettingsResponse settings = shopSettingsService.getSettings();
        BigDecimal shipping = coupon != null && coupon.isFreeShipping()
                ? BigDecimal.ZERO
                : resolveShippingCost(shippingMethod, settings, shippingState, shippingCountry);
        BigDecimal tax = resolveCartTax(subtotal, discount, shipping, items, settings, shippingState, shippingCountry);
        BigDecimal total = afterDiscount.add(shipping).add(tax).setScale(2, RoundingMode.HALF_UP);

        return new CheckoutTotals(subtotal, discount, shipping, tax, total,
                coupon == null ? null : coupon.getCode(), coupon != null && coupon.isFreeShipping());
    }

    public CheckoutTotals calculateForOrderItems(BigDecimal subtotal, String couponCode, ShippingMethod shippingMethod, Long userId,
                                                 List<OrderItem> items, String shippingState, String shippingCountry) {
        Coupon coupon = resolveCouponForOrderItems(subtotal, couponCode, userId, items);
        BigDecimal discount = resolveDiscount(subtotal, coupon);
        BigDecimal afterDiscount = subtotal.subtract(discount).max(BigDecimal.ZERO);
        AdminSettingsResponse settings = shopSettingsService.getSettings();
        BigDecimal shipping = coupon != null && coupon.isFreeShipping()
                ? BigDecimal.ZERO
                : resolveShippingCost(shippingMethod, settings, shippingState, shippingCountry);
        BigDecimal tax = resolveOrderItemTax(subtotal, discount, shipping, items, settings, shippingState, shippingCountry);
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

    private Coupon resolveCouponForOrderItems(BigDecimal subtotal, String couponCode, Long userId, List<OrderItem> items) {
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
                throw new ApiException(HttpStatus.BAD_REQUEST, "Coupon does not apply to items in your order");
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

    private BigDecimal resolveCartTax(BigDecimal subtotal, BigDecimal discount, BigDecimal shipping, List<CartItem> items,
                                      AdminSettingsResponse settings, String state, String country) {
        if (items == null || items.isEmpty()) {
            return defaultTax(subtotal.subtract(discount).max(BigDecimal.ZERO), shipping, settings, state, country);
        }
        BigDecimal tax = BigDecimal.ZERO;
        for (CartItem item : items) {
            BigDecimal line = item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            tax = tax.add(taxForLine(line, subtotal, discount, item.getProduct(), settings, state, country));
        }
        return tax.add(shippingTax(shipping, settings, state, country)).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal resolveOrderItemTax(BigDecimal subtotal, BigDecimal discount, BigDecimal shipping, List<OrderItem> items,
                                           AdminSettingsResponse settings, String state, String country) {
        if (items == null || items.isEmpty()) {
            return defaultTax(subtotal.subtract(discount).max(BigDecimal.ZERO), shipping, settings, state, country);
        }
        BigDecimal tax = BigDecimal.ZERO;
        for (OrderItem item : items) {
            BigDecimal line = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            tax = tax.add(taxForLine(line, subtotal, discount, item.getProduct(), settings, state, country));
        }
        return tax.add(shippingTax(shipping, settings, state, country)).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal taxForLine(BigDecimal line, BigDecimal subtotal, BigDecimal discount, Product product,
                                  AdminSettingsResponse settings, String state, String country) {
        BigDecimal lineDiscount = subtotal.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : line.multiply(discount).divide(subtotal, 6, RoundingMode.HALF_UP);
        BigDecimal taxable = line.subtract(lineDiscount).max(BigDecimal.ZERO);
        return taxable.multiply(resolveTaxRate(product, settings, state, country));
    }

    private BigDecimal defaultTax(BigDecimal taxableItems, BigDecimal shipping, AdminSettingsResponse settings,
                                  String state, String country) {
        return taxableItems.add(shipping)
                .multiply(resolveDefaultTaxRate(settings, state, country))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal shippingTax(BigDecimal shipping, AdminSettingsResponse settings, String state, String country) {
        return shipping.multiply(resolveDefaultTaxRate(settings, state, country));
    }

    private BigDecimal resolveTaxRate(Product product, AdminSettingsResponse settings, String state, String country) {
        if (product != null && product.getTaxRate() != null) {
            return product.getTaxRate();
        }
        BigDecimal destinationRate = resolveDestinationTaxRate(settings, state, country);
        if (destinationRate != null) {
            return destinationRate;
        }
        Category category = product == null ? null : product.getCategory();
        while (category != null) {
            if (category.getTaxRate() != null) {
                return category.getTaxRate();
            }
            category = category.getParent();
        }
        return settings.taxRate() == null ? taxRate : settings.taxRate();
    }

    private BigDecimal resolveDestinationTaxRate(AdminSettingsResponse settings, String state, String country) {
        BigDecimal stateRate = lookup(settings.stateTaxRates(), state);
        if (stateRate != null) {
            return stateRate;
        }
        return lookup(settings.countryTaxRates(), country);
    }

    private BigDecimal resolveDefaultTaxRate(AdminSettingsResponse settings, String state, String country) {
        BigDecimal destinationRate = resolveDestinationTaxRate(settings, state, country);
        return destinationRate == null ? settings.taxRate() == null ? taxRate : settings.taxRate() : destinationRate;
    }

    private BigDecimal resolveShippingCost(ShippingMethod shippingMethod, AdminSettingsResponse settings,
                                           String state, String country) {
        ShippingMethod method = shippingMethod == null ? ShippingMethod.STANDARD : shippingMethod;
        if (method == ShippingMethod.EXPRESS) {
            BigDecimal stateCost = lookup(settings.expressShippingStateCosts(), state);
            if (stateCost != null) {
                return stateCost;
            }
            BigDecimal countryCost = lookup(settings.expressShippingCountryCosts(), country);
            return countryCost == null ? settings.expressShippingCost() : countryCost;
        }
        BigDecimal stateCost = lookup(settings.standardShippingStateCosts(), state);
        if (stateCost != null) {
            return stateCost;
        }
        BigDecimal countryCost = lookup(settings.standardShippingCountryCosts(), country);
        return countryCost == null ? settings.standardShippingCost() : countryCost;
    }

    private BigDecimal lookup(Map<String, BigDecimal> rates, String location) {
        if (rates == null || location == null || location.isBlank()) {
            return null;
        }
        return rates.get(location.trim().toUpperCase(Locale.ROOT));
    }
}
