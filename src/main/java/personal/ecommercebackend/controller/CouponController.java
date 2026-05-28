package personal.ecommercebackend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import personal.ecommercebackend.dto.request.CouponRequest;
import personal.ecommercebackend.dto.request.CouponValidateRequest;
import personal.ecommercebackend.dto.response.CouponResponse;
import personal.ecommercebackend.dto.response.CouponValidateResponse;
import personal.ecommercebackend.service.AuditService;
import personal.ecommercebackend.service.CouponService;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;
    private final AuditService auditService;

    @PostMapping("/coupons/validate")
    public CouponValidateResponse validate(@Valid @RequestBody CouponValidateRequest request) {
        return couponService.validate(request);
    }

    @GetMapping("/admin/coupons")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CouponResponse> list() {
        return couponService.listAll();
    }

    @PostMapping("/admin/coupons")
    @PreAuthorize("hasRole('ADMIN')")
    public CouponResponse create(@Valid @RequestBody CouponRequest request) {
        CouponResponse c = couponService.create(request);
        auditService.log("CREATE", "COUPON", String.valueOf(c.id()), c.code());
        return c;
    }

    @PutMapping("/admin/coupons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CouponResponse update(@PathVariable Long id, @Valid @RequestBody CouponRequest request) {
        return couponService.update(id, request);
    }

    @DeleteMapping("/admin/coupons/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        couponService.delete(id);
        auditService.log("DELETE", "COUPON", String.valueOf(id), null);
    }
}
