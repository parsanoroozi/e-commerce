package personal.ecommercebackend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import personal.ecommercebackend.dto.request.CheckoutRequest;
import personal.ecommercebackend.dto.request.OrderStatusUpdateRequest;
import personal.ecommercebackend.dto.request.RefundRequest;
import personal.ecommercebackend.dto.response.CheckoutInitResponse;
import personal.ecommercebackend.dto.response.OrderResponse;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.dto.response.PaymentConfigResponse;
import personal.ecommercebackend.service.OrderService;
import personal.ecommercebackend.service.AuditService;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final AuditService auditService;

    @GetMapping("/payment-config")
    public PaymentConfigResponse paymentConfig() {
        return orderService.paymentConfig();
    }

    @PostMapping("/checkout/initiate")
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutInitResponse initiateCheckout(@Valid @RequestBody CheckoutRequest request) {
        return orderService.initiateCheckout(request);
    }

    @PostMapping("/{id}/confirm-payment")
    public OrderResponse confirmPayment(@PathVariable Long id) {
        return orderService.confirmPayment(id);
    }

    @PostMapping("/{id}/cancel")
    public OrderResponse cancel(@PathVariable Long id) {
        return orderService.cancelOrder(id);
    }

    @GetMapping
    public PageResponse<OrderResponse> myOrders(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return orderService.myOrders(pageable);
    }

    @GetMapping("/{id}")
    public OrderResponse findById(@PathVariable Long id) {
        return orderService.findById(id);
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasAuthority('MANAGE_ORDERS')")
    public PageResponse<OrderResponse> allOrders(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return orderService.allOrders(pageable);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('MANAGE_ORDERS')")
    public OrderResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderStatusUpdateRequest request) {
        OrderResponse order = orderService.updateStatus(id, request);
        auditService.log("UPDATE_STATUS", "ORDER", String.valueOf(id), order.status().name());
        return order;
    }

    @PostMapping("/{id}/refunds")
    @PreAuthorize("hasAuthority('MANAGE_ORDERS')")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse refund(
            @PathVariable Long id,
            @Valid @RequestBody RefundRequest request) {
        OrderResponse order = orderService.refundOrder(id, request);
        auditService.log("REFUND", "ORDER", String.valueOf(id), request.amount().toPlainString());
        return order;
    }
}
