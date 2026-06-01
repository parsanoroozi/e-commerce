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
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    public List<CouponResponse> list() {
        return couponService.listAll();
    }

    @PostMapping("/admin/coupons")
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    public CouponResponse create(@Valid @RequestBody CouponRequest request) {
        CouponResponse c = couponService.create(request);
        auditService.log("CREATE", "COUPON", String.valueOf(c.id()), c.code());
        return c;
    }

    @PutMapping("/admin/coupons/{id}")
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    public CouponResponse update(@PathVariable Long id, @Valid @RequestBody CouponRequest request) {
        CouponResponse c = couponService.update(id, request);
        auditService.log("UPDATE", "COUPON", String.valueOf(c.id()), c.code());
        return c;
    }

    @DeleteMapping("/admin/coupons/{id}")
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    public void delete(@PathVariable Long id) {
        couponService.delete(id);
        auditService.log("DELETE", "COUPON", String.valueOf(id), null);
    }
}
