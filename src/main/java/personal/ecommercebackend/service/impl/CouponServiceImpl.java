package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.request.CouponRequest;
import personal.ecommercebackend.dto.request.CouponValidateRequest;
import personal.ecommercebackend.dto.response.CouponResponse;
import personal.ecommercebackend.dto.response.CouponValidateResponse;
import personal.ecommercebackend.dto.CheckoutTotals;
import personal.ecommercebackend.entity.Coupon;
import personal.ecommercebackend.entity.Order;
import personal.ecommercebackend.entity.ShippingMethod;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.CartRepository;
import personal.ecommercebackend.repository.CouponRepository;
import personal.ecommercebackend.repository.OrderRepository;
import personal.ecommercebackend.security.SecurityUtils;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;
    private final CheckoutPricingService checkoutPricingService;
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;

    @Transactional(readOnly = true)
    public List<CouponResponse> listAll() {
        return couponRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public CouponResponse create(CouponRequest request) {
        couponRepository.findByCodeIgnoreCase(request.code()).ifPresent(c -> {
            throw new ApiException(HttpStatus.CONFLICT, "Coupon code exists");
        });
        return toResponse(couponRepository.save(map(new Coupon(), request)));
    }

    @Transactional
    public CouponResponse update(Long id, CouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Coupon not found"));
        return toResponse(couponRepository.save(map(coupon, request)));
    }

    @Transactional
    public void delete(Long id) {
        couponRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public CouponValidateResponse validate(CouponValidateRequest request) {
        try {
            Long userId = SecurityUtils.currentUserId();
            var cart = cartRepository.findByUserId(userId).orElse(null);
            CheckoutTotals totals = checkoutPricingService.calculate(
                    request.subtotal(),
                    request.code(),
                    ShippingMethod.STANDARD,
                    userId,
                    cart == null ? List.of() : cart.getItems());
            return new CouponValidateResponse(true, totals.discount(), totals.freeShipping(), "Coupon applied");
        } catch (ApiException e) {
            return new CouponValidateResponse(false, BigDecimal.ZERO, false, e.getMessage());
        }
    }

    private Coupon map(Coupon coupon, CouponRequest request) {
        validateDiscount(request);
        coupon.setCode(request.code().trim().toUpperCase());
        coupon.setDiscountPercent(request.discountPercent());
        coupon.setDiscountAmount(request.discountAmount());
        coupon.setMinOrderAmount(request.minOrderAmount());
        coupon.setExpiresAt(request.expiresAt());
        coupon.setUsageLimit(request.usageLimit());
        coupon.setPerUserUsageLimit(request.perUserUsageLimit());
        coupon.setFreeShipping(Boolean.TRUE.equals(request.freeShipping()));
        coupon.setProductIds(request.productIds() == null ? new HashSet<>() : new HashSet<>(request.productIds()));
        coupon.setCategoryIds(request.categoryIds() == null ? new HashSet<>() : new HashSet<>(request.categoryIds()));
        if (request.active() != null) {
            coupon.setActive(request.active());
        }
        return coupon;
    }

    private void validateDiscount(CouponRequest request) {
        boolean hasPercent = request.discountPercent() != null;
        boolean hasAmount = request.discountAmount() != null;
        boolean hasFreeShipping = Boolean.TRUE.equals(request.freeShipping());
        if ((hasPercent ? 1 : 0) + (hasAmount ? 1 : 0) + (hasFreeShipping ? 1 : 0) == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Provide a discount type or free shipping");
        }
        if (hasPercent && hasAmount) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Provide only one monetary discount type: percent or amount");
        }
        if (hasPercent && (request.discountPercent().compareTo(BigDecimal.ZERO) <= 0
                || request.discountPercent().compareTo(BigDecimal.valueOf(100)) > 0)) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Discount percent must be greater than 0 and no more than 100");
        }
        if (hasAmount && request.discountAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Discount amount must be greater than 0");
        }
        if (request.minOrderAmount() != null && request.minOrderAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Minimum order amount cannot be negative");
        }
        if (request.usageLimit() != null && request.usageLimit() < 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Usage limit must be at least 1");
        }
        if (request.perUserUsageLimit() != null && request.perUserUsageLimit() < 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Per-user usage limit must be at least 1");
        }
    }

    private CouponResponse toResponse(Coupon coupon) {
        List<Order> orders = orderRepository.findByCouponCodeIgnoreCase(coupon.getCode());
        BigDecimal revenue = orders.stream()
                .map(order -> {
                    BigDecimal total = order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount();
                    BigDecimal refunded = order.getRefundedAmount() == null ? BigDecimal.ZERO : order.getRefundedAmount();
                    return total.subtract(refunded).max(BigDecimal.ZERO);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return EntityMapper.toCouponResponse(
                coupon,
                orders.size(),
                orderRepository.countDistinctUsersByCouponCode(coupon.getCode()),
                revenue);
    }
}
