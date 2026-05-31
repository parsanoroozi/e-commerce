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
import personal.ecommercebackend.entity.Coupon;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.CouponRepository;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;
    private final CheckoutPricingService checkoutPricingService;

    @Transactional(readOnly = true)
    public List<CouponResponse> listAll() {
        return couponRepository.findAll().stream().map(EntityMapper::toCouponResponse).toList();
    }

    @Transactional
    public CouponResponse create(CouponRequest request) {
        couponRepository.findByCodeIgnoreCase(request.code()).ifPresent(c -> {
            throw new ApiException(HttpStatus.CONFLICT, "Coupon code exists");
        });
        return EntityMapper.toCouponResponse(couponRepository.save(map(new Coupon(), request)));
    }

    @Transactional
    public CouponResponse update(Long id, CouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Coupon not found"));
        return EntityMapper.toCouponResponse(couponRepository.save(map(coupon, request)));
    }

    @Transactional
    public void delete(Long id) {
        couponRepository.deleteById(id);
    }

    public CouponValidateResponse validate(CouponValidateRequest request) {
        try {
            BigDecimal discount = checkoutPricingService.previewDiscount(request.subtotal(), request.code());
            return new CouponValidateResponse(true, discount, "Coupon applied");
        } catch (ApiException e) {
            return new CouponValidateResponse(false, BigDecimal.ZERO, e.getMessage());
        }
    }

    private Coupon map(Coupon coupon, CouponRequest request) {
        validateDiscount(request);
        coupon.setCode(request.code().trim().toUpperCase());
        coupon.setDiscountPercent(request.discountPercent());
        coupon.setDiscountAmount(request.discountAmount());
        coupon.setMinOrderAmount(request.minOrderAmount());
        coupon.setExpiresAt(request.expiresAt());
        if (request.active() != null) {
            coupon.setActive(request.active());
        }
        return coupon;
    }

    private void validateDiscount(CouponRequest request) {
        boolean hasPercent = request.discountPercent() != null;
        boolean hasAmount = request.discountAmount() != null;
        if (hasPercent == hasAmount) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Provide exactly one discount type: percent or amount");
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
    }
}
