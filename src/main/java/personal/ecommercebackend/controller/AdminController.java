package personal.ecommercebackend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import personal.ecommercebackend.dto.request.ShopSettingsRequest;
import personal.ecommercebackend.dto.request.CustomerManagementRequest;
import personal.ecommercebackend.dto.request.InventoryAdjustmentRequest;
import personal.ecommercebackend.dto.response.AdminDashboardResponse;
import personal.ecommercebackend.dto.response.AdminSettingsResponse;
import personal.ecommercebackend.dto.response.AuditLogResponse;
import personal.ecommercebackend.dto.response.CustomerDetailResponse;
import personal.ecommercebackend.dto.response.CustomerSummaryResponse;
import personal.ecommercebackend.dto.response.InventoryAdjustmentResponse;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.service.AdminDashboardService;
import personal.ecommercebackend.service.AdminUserService;
import personal.ecommercebackend.service.AuditService;
import personal.ecommercebackend.service.InventoryService;
import personal.ecommercebackend.service.ReportExportService;
import personal.ecommercebackend.service.ShopSettingsService;

import java.time.Instant;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ADMIN_ACCESS')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminDashboardService dashboardService;
    private final AdminUserService adminUserService;
    private final AuditService auditService;
    private final ShopSettingsService shopSettingsService;
    private final InventoryService inventoryService;
    private final ReportExportService reportExportService;

    @GetMapping("/dashboard")
    public AdminDashboardResponse dashboard() {
        return dashboardService.getDashboard();
    }

    @GetMapping("/settings")
    public AdminSettingsResponse settings() {
        return shopSettingsService.getSettings();
    }

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    public PageResponse<CustomerSummaryResponse> users(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return adminUserService.list(pageable);
    }

    @GetMapping("/users/{id}")
    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    public CustomerDetailResponse user(@PathVariable Long id) {
        return adminUserService.detail(id);
    }

    @PatchMapping("/users/{id}")
    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    public CustomerDetailResponse updateUser(
            @PathVariable Long id,
            @Valid @RequestBody CustomerManagementRequest request) {
        CustomerDetailResponse response = adminUserService.updateCustomer(id, request);
        auditService.log("UPDATE", "USER", String.valueOf(id), "Customer management fields updated");
        return response;
    }

    @PostMapping("/users/{id}/password-reset")
    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void sendUserPasswordReset(@PathVariable Long id) {
        adminUserService.sendPasswordReset(id);
        auditService.log("PASSWORD_RESET", "USER", String.valueOf(id), null);
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id) {
        adminUserService.delete(id);
        auditService.log("DELETE", "USER", String.valueOf(id), null);
    }

    @PutMapping("/settings")
    @PreAuthorize("hasAuthority('MANAGE_SETTINGS')")
    public AdminSettingsResponse updateSettings(@Valid @RequestBody ShopSettingsRequest request) {
        return shopSettingsService.updateSettings(request);
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasAuthority('VIEW_AUDIT')")
    public PageResponse<AuditLogResponse> auditLogs(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return auditService.list(pageable);
    }

    @PostMapping("/inventory/adjustments")
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    @ResponseStatus(HttpStatus.CREATED)
    public InventoryAdjustmentResponse adjustInventory(@Valid @RequestBody InventoryAdjustmentRequest request) {
        InventoryAdjustmentResponse response = inventoryService.adjust(request);
        auditService.log("ADJUST", "INVENTORY", String.valueOf(response.productId()), request.reason());
        return response;
    }

    @GetMapping("/inventory/adjustments")
    @PreAuthorize("hasAnyAuthority('MANAGE_CATALOG','VIEW_AUDIT')")
    public PageResponse<InventoryAdjustmentResponse> inventoryHistory(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return inventoryService.history(pageable);
    }

    @GetMapping("/reports/orders.csv")
    @PreAuthorize("hasAuthority('MANAGE_ORDERS')")
    public ResponseEntity<String> exportOrders(
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false) personal.ecommercebackend.entity.OrderStatus status) {
        String csv = reportExportService.exportOrdersCsv(from, to, status);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=orders.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/orders/export")
    @PreAuthorize("hasAuthority('MANAGE_ORDERS')")
    public ResponseEntity<String> legacyExportOrders(
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false) personal.ecommercebackend.entity.OrderStatus status) {
        return exportOrders(from, to, status);
    }

    @GetMapping("/reports/customers.csv")
    @PreAuthorize("hasAuthority('MANAGE_USERS')")
    public ResponseEntity<String> exportCustomers(
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false) String status) {
        String csv = reportExportService.exportCustomersCsv(from, to, status);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=customers.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/reports/products.csv")
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    public ResponseEntity<String> exportProducts(
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(required = false) String status) {
        String csv = reportExportService.exportProductsCsv(from, to, status);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=products-inventory.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csv);
    }

    @GetMapping("/reports/orders/{id}/invoice.pdf")
    @PreAuthorize("hasAuthority('MANAGE_ORDERS')")
    public ResponseEntity<byte[]> invoice(@PathVariable Long id) {
        byte[] pdf = reportExportService.invoicePdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=invoice-" + id + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
