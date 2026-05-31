package personal.ecommercebackend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;
import personal.ecommercebackend.dto.request.UpdateLowStockThresholdRequest;
import personal.ecommercebackend.dto.response.AdminDashboardResponse;
import personal.ecommercebackend.dto.response.AdminSettingsResponse;
import personal.ecommercebackend.dto.response.AuditLogResponse;
import personal.ecommercebackend.dto.response.OrderResponse;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.service.AdminDashboardService;
import personal.ecommercebackend.service.AdminUserService;
import personal.ecommercebackend.service.AuditService;
import personal.ecommercebackend.service.OrderService;
import personal.ecommercebackend.service.ShopSettingsService;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminDashboardService dashboardService;
    private final AdminUserService adminUserService;
    private final AuditService auditService;
    private final OrderService orderService;
    private final ShopSettingsService shopSettingsService;

    @GetMapping("/dashboard")
    public AdminDashboardResponse dashboard() {
        return dashboardService.getDashboard();
    }

    @GetMapping("/settings")
    public AdminSettingsResponse settings() {
        return shopSettingsService.getSettings();
    }

    @GetMapping("/users")
    public PageResponse<personal.ecommercebackend.dto.response.UserResponse> users(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return adminUserService.list(pageable);
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id) {
        adminUserService.delete(id);
        auditService.log("DELETE", "USER", String.valueOf(id), null);
    }

    @PatchMapping("/settings/low-stock-threshold")
    public AdminSettingsResponse updateLowStockThreshold(@Valid @RequestBody UpdateLowStockThresholdRequest request) {
        return shopSettingsService.updateLowStockThreshold(request);
    }

    @GetMapping("/audit-logs")
    public PageResponse<AuditLogResponse> auditLogs(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return auditService.list(pageable);
    }

    @GetMapping("/orders/export")
    public ResponseEntity<String> exportOrders() {
        PageResponse<OrderResponse> orders = orderService.allOrders(PageRequest.of(0, 1000));
        StringBuilder csv = new StringBuilder("id,status,total,email,createdAt\n");
        for (OrderResponse o : orders.content()) {
            csv.append(o.id()).append(',')
                    .append(o.status()).append(',')
                    .append(o.totalAmount()).append(',')
                    .append(o.customer() != null ? o.customer().email() : "").append(',')
                    .append(o.createdAt()).append('\n');
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=orders.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv.toString());
    }
}
