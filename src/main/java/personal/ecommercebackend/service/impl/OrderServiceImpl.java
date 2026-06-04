package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.ResolvedShipping;
import personal.ecommercebackend.dto.request.CheckoutRequest;
import personal.ecommercebackend.dto.request.OrderStatusUpdateRequest;
import personal.ecommercebackend.dto.request.RefundRequest;
import personal.ecommercebackend.dto.response.CheckoutInitResponse;
import personal.ecommercebackend.dto.response.OrderResponse;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.dto.response.PaymentConfigResponse;
import personal.ecommercebackend.entity.*;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.CartRepository;
import personal.ecommercebackend.repository.OrderRepository;
import personal.ecommercebackend.repository.ProductRepository;
import personal.ecommercebackend.repository.ProductVariantRepository;
import personal.ecommercebackend.repository.UserRepository;
import personal.ecommercebackend.security.SecurityUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final ProductService productService;
    private final StripePaymentService stripePaymentService;
    private final PaymentModeService paymentModeService;
    private final EmailService emailService;
    private final ShippingAddressService shippingAddressService;
    private final CheckoutPricingService checkoutPricingService;
    private final NotificationService notificationService;

    @Value("${app.orders.abandoned-timeout-minutes:30}")
    private long abandonedTimeoutMinutes;

    public PaymentConfigResponse paymentConfig() {
        return new PaymentConfigResponse(
                stripePaymentService.isConfigured() ? stripePaymentService.publishableKey() : null,
                paymentModeService.isStripeEnabled(),
                paymentModeService.isDevModeActive());
    }

    @Transactional
    public CheckoutInitResponse initiateCheckout(CheckoutRequest request) {
        if (!paymentModeService.isStripeEnabled() && !paymentModeService.isDevModeActive()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Payment system is not configured. Add Stripe keys or enable app.payment.dev-mode.");
        }

        Long userId = SecurityUtils.currentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cart is empty");
        }

        ResolvedShipping shipping = shippingAddressService.resolveForCheckout(request);
        ShippingMethod shippingMethod = resolveShippingMethod(request.shippingMethod());

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;

        for (CartItem cartItem : cart.getItems()) {
            Product product = productService.getProduct(cartItem.getProduct().getId());
            ProductVariant variant = cartItem.getVariant();
            validateProductAvailability(product, variant, cartItem.getQuantity());

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .variant(variant)
                    .productName(product.getName())
                    .variantName(variant == null ? null : variant.displayName())
                    .sku(variant != null && variant.getSku() != null ? variant.getSku() : product.getSku())
                    .quantity(cartItem.getQuantity())
                    .unitPrice(product.getPrice())
                    .build();

            orderItems.add(orderItem);
            subtotal = subtotal.add(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }

        var totals = checkoutPricingService.calculate(subtotal, request.couponCode(), shippingMethod, userId, cart.getItems(),
                shipping.state(), shipping.country());

        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.AWAITING_PAYMENT)
                .subtotalAmount(totals.subtotal())
                .discountAmount(totals.discount())
                .shippingCost(totals.shipping())
                .taxAmount(totals.tax())
                .totalAmount(totals.total())
                .couponCode(totals.couponCode())
                .shippingMethod(shippingMethod)
                .shippingStreet(shipping.street())
                .shippingCity(shipping.city())
                .shippingState(shipping.state())
                .shippingZipCode(shipping.zipCode())
                .shippingCountry(shipping.country())
                .shippingLatitude(shipping.latitude())
                .shippingLongitude(shipping.longitude())
                .items(new ArrayList<>())
                .confirmationEmailSent(false)
                .build();

        for (OrderItem item : orderItems) {
            item.setOrder(order);
            order.getItems().add(item);
        }

        Order saved = orderRepository.save(order);
        log.info("Checkout initiated orderId={} userId={} subtotal={} total={} devMode={}",
                saved.getId(), userId, saved.getSubtotalAmount(), saved.getTotalAmount(),
                paymentModeService.isDevModeActive());

        if (paymentModeService.isDevModeActive()) {
            saved.setStripePaymentIntentId(paymentModeService.devPaymentIntentId(saved.getId()));
            orderRepository.save(saved);
            return new CheckoutInitResponse(
                    saved.getId(),
                    null,
                    null,
                    saved.getTotalAmount(),
                    true);
        }

        PaymentIntent intent = stripePaymentService.createPaymentIntent(saved, user);
        saved.setStripePaymentIntentId(intent.getId());
        orderRepository.save(saved);

        return new CheckoutInitResponse(
                saved.getId(),
                intent.getClientSecret(),
                stripePaymentService.publishableKey(),
                saved.getTotalAmount(),
                false);
    }

    @Transactional
    public CheckoutInitResponse updateCheckout(Long orderId, CheckoutRequest request) {
        Order order = orderRepository.findWithDetailsByIdAndUserIdForUpdate(orderId, SecurityUtils.currentUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        if (order.getStatus() != OrderStatus.AWAITING_PAYMENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only unpaid checkout orders can be edited");
        }

        ResolvedShipping shipping = shippingAddressService.resolveForCheckout(request);
        ShippingMethod shippingMethod = resolveShippingMethod(request.shippingMethod());
        BigDecimal subtotal = order.getItems().stream()
                .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        var totals = checkoutPricingService.calculateForOrderItems(subtotal, request.couponCode(), shippingMethod, order.getUser().getId(),
                order.getItems(), shipping.state(), shipping.country());

        order.setSubtotalAmount(totals.subtotal());
        order.setDiscountAmount(totals.discount());
        order.setShippingCost(totals.shipping());
        order.setTaxAmount(totals.tax());
        order.setTotalAmount(totals.total());
        order.setCouponCode(totals.couponCode());
        order.setShippingMethod(shippingMethod);
        order.setShippingStreet(shipping.street());
        order.setShippingCity(shipping.city());
        order.setShippingState(shipping.state());
        order.setShippingZipCode(shipping.zipCode());
        order.setShippingCountry(shipping.country());
        order.setShippingLatitude(shipping.latitude());
        order.setShippingLongitude(shipping.longitude());

        if (!paymentModeService.isDevModeActive() && order.getStripePaymentIntentId() != null) {
            PaymentIntent intent = stripePaymentService.updatePaymentIntentAmount(
                    order.getStripePaymentIntentId(),
                    order.getTotalAmount());
            orderRepository.save(order);
            return new CheckoutInitResponse(
                    order.getId(),
                    intent.getClientSecret(),
                    stripePaymentService.publishableKey(),
                    order.getTotalAmount(),
                    false);
        }

        orderRepository.save(order);
        return new CheckoutInitResponse(
                order.getId(),
                null,
                null,
                order.getTotalAmount(),
                true);
    }

    @Transactional
    public OrderResponse confirmPayment(Long orderId) {
        Order order = orderRepository.findWithDetailsByIdAndUserIdForUpdate(orderId, SecurityUtils.currentUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getStatus() == OrderStatus.CONFIRMED) {
            log.info("Payment confirmation ignored for already confirmed orderId={}", order.getId());
            return EntityMapper.toOrderResponse(order, false);
        }

        if (order.getStripePaymentIntentId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Order has no payment associated");
        }

        if (paymentModeService.isDevPaymentIntent(order.getStripePaymentIntentId())) {
            return EntityMapper.toOrderResponse(fulfillPaidOrder(order), false);
        }

        PaymentIntent intent = stripePaymentService.retrievePaymentIntent(order.getStripePaymentIntentId());
        if (!stripePaymentService.isPaymentSucceeded(intent)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Payment has not been completed yet");
        }

        return EntityMapper.toOrderResponse(fulfillPaidOrder(order), false);
    }

    @Transactional
    public void fulfillByPaymentIntentId(String paymentIntentId) {
        if (paymentModeService.isDevPaymentIntent(paymentIntentId)) {
            return;
        }
        Order order = orderRepository.findWithDetailsByStripePaymentIntentIdForUpdate(paymentIntentId)
                .orElse(null);
        if (order == null || order.getStatus() == OrderStatus.CONFIRMED) {
            return;
        }
        PaymentIntent intent = stripePaymentService.retrievePaymentIntent(paymentIntentId);
        if (stripePaymentService.isPaymentSucceeded(intent)) {
            fulfillPaidOrder(order);
        }
    }

    private Order fulfillPaidOrder(Order order) {
        if (order.getStatus() == OrderStatus.CONFIRMED) {
            return order;
        }

        for (OrderItem item : order.getItems()) {
            Product product = productRepository.findByIdForUpdate(item.getProduct().getId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
            ProductVariant variant = lockVariant(item);
            int available = variant == null ? product.getStockQuantity() : variant.getStockQuantity();
            if (available < item.getQuantity()) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Insufficient stock for '" + product.getName() + "'");
            }
            if (variant == null) {
                product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
            } else {
                variant.setStockQuantity(variant.getStockQuantity() - item.getQuantity());
                syncAggregateStock(product);
            }
        }

        cartRepository.findByUserId(order.getUser().getId()).ifPresent(cart -> cart.getItems().clear());

        OrderStatus previous = order.getStatus();
        order.setStatus(OrderStatus.CONFIRMED);
        appendTimeline(order, null, "PAYMENT_CONFIRMED", previous, OrderStatus.CONFIRMED,
                null, null, "Payment confirmed and stock deducted.");
        Order saved = orderRepository.save(order);
        log.info("Order fulfilled orderId={} userId={} total={} itemCount={}",
                saved.getId(), saved.getUser().getId(), saved.getTotalAmount(), saved.getItems().size());

        if (!saved.isConfirmationEmailSent()) {
            Long orderId = saved.getId();
            Long userId = saved.getUser().getId();
            emailService.sendOrderConfirmation(saved, saved.getUser())
                    .thenAccept(sent -> markConfirmationEmailSent(orderId, userId, sent));
        }

        notificationService.notifyUser(saved.getUser(), "Order confirmed",
                "Your order #" + saved.getId() + " has been confirmed.", saved.getId());

        return saved;
    }

    private void markConfirmationEmailSent(Long orderId, Long userId, boolean sent) {
        if (!sent) {
            log.warn("Order confirmation email failed orderId={} userId={}", orderId, userId);
            return;
        }
        orderRepository.findById(orderId).ifPresent(order -> {
            order.setConfirmationEmailSent(true);
            orderRepository.save(order);
        });
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId) {
        Order order = orderRepository.findWithDetailsByIdAndUserIdForUpdate(orderId, SecurityUtils.currentUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        if (order.getStatus() != OrderStatus.CONFIRMED
                && order.getStatus() != OrderStatus.PENDING
                && order.getStatus() != OrderStatus.AWAITING_PAYMENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Order cannot be cancelled at this stage");
        }
        if (order.getStatus() == OrderStatus.CONFIRMED) {
            restoreStock(order);
        }
        OrderStatus previous = order.getStatus();
        order.setStatus(OrderStatus.CANCELLED);
        appendTimeline(order, null, "ORDER_CANCELLED", previous, OrderStatus.CANCELLED,
                null, null, "Order cancelled by customer.");
        Order saved = orderRepository.save(order);
        log.info("Order cancelled orderId={} userId={}", saved.getId(), saved.getUser().getId());
        notificationService.notifyUser(saved.getUser(), "Order cancelled",
                "Your order #" + saved.getId() + " was cancelled.", saved.getId());
        return EntityMapper.toOrderResponse(saved, false);
    }

    private void restoreStock(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = productRepository.findByIdForUpdate(item.getProduct().getId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
            ProductVariant variant = lockVariant(item);
            if (variant == null) {
                product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            } else {
                variant.setStockQuantity(variant.getStockQuantity() + item.getQuantity());
                syncAggregateStock(product);
            }
        }
    }

    private ShippingMethod resolveShippingMethod(String value) {
        if (value == null || value.isBlank()) {
            return ShippingMethod.STANDARD;
        }
        try {
            return ShippingMethod.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid shipping method");
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> myOrders(Pageable pageable) {
        Page<Order> page = orderRepository.findByUserIdOrderByCreatedAtDesc(
                SecurityUtils.currentUserId(), pageable);
        return PageResponse.from(page.map(o -> EntityMapper.toOrderResponse(o, false)));
    }

    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> allOrders(Pageable pageable) {
        Page<Order> page = orderRepository.findAllByOrderByCreatedAtDesc(pageable);
        return PageResponse.from(page.map(o -> EntityMapper.toOrderResponse(o, true)));
    }

    @Transactional(readOnly = true)
    public OrderResponse findById(Long id) {
        if (SecurityUtils.isAdmin()) {
            Order order = orderRepository.findWithDetailsById(id)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
            return EntityMapper.toOrderResponse(order, true);
        }
        Order order = orderRepository.findWithDetailsByIdAndUserId(id, SecurityUtils.currentUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        return EntityMapper.toOrderResponse(order, false);
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatusUpdateRequest request) {
        Order order = orderRepository.findWithDetailsByIdForUpdate(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        if (order.getStatus() == OrderStatus.AWAITING_PAYMENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot update status until payment is completed");
        }
        if (request.status() == OrderStatus.AWAITING_PAYMENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot move an order back to awaiting payment");
        }
        OrderStatus previous = order.getStatus();
        User admin = userRepository.findById(SecurityUtils.currentUserId()).orElse(null);
        String carrier = normalizeOptional(request.shippingCarrier());
        String trackingNumber = normalizeOptional(request.trackingNumber());
        String adminNotes = normalizeOptional(request.adminNotes());
        String timelineNote = normalizeOptional(request.timelineNote());

        if (carrier != null) {
            order.setShippingCarrier(carrier);
        }
        if (trackingNumber != null) {
            order.setTrackingNumber(trackingNumber);
        }
        if (request.adminNotes() != null) {
            order.setAdminNotes(adminNotes);
        }
        if (request.status() == OrderStatus.CANCELLED
                && (previous == OrderStatus.CONFIRMED || previous == OrderStatus.PACKED)) {
            restoreStock(order);
        }
        order.setStatus(request.status());
        applyFulfillmentTimestamps(order, request.status());
        appendTimeline(order, admin, "FULFILLMENT_UPDATED", previous, request.status(),
                carrier, trackingNumber, timelineNote);
        Order saved = orderRepository.save(order);
        log.info("Admin updated order status orderId={} from={} to={}",
                saved.getId(), previous, request.status());

        if (request.status() == OrderStatus.SHIPPED && !saved.isShipmentEmailSent()) {
            Long orderId = saved.getId();
            Long userId = saved.getUser().getId();
            emailService.sendOrderShipped(saved, saved.getUser())
                    .thenAccept(sent -> markShipmentEmailSent(orderId, userId, sent));
            notificationService.notifyUser(saved.getUser(), "Order shipped",
                    "Your order #" + saved.getId() + " is on the way!", saved.getId());
        }
        if (request.status() == OrderStatus.DELIVERED && previous != OrderStatus.DELIVERED) {
            notificationService.notifyUser(saved.getUser(), "Order delivered",
                    "Your order #" + saved.getId() + " has been delivered.", saved.getId());
        }

        return EntityMapper.toOrderResponse(saved, true);
    }

    @Transactional
    public OrderResponse refundOrder(Long id, RefundRequest request) {
        Order order = orderRepository.findWithDetailsByIdForUpdate(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        if (order.getStatus() == OrderStatus.AWAITING_PAYMENT || order.getStatus() == OrderStatus.CANCELLED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only paid orders can be refunded");
        }
        if (order.getStripePaymentIntentId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Order has no payment to refund");
        }
        BigDecimal amount = request.amount().setScale(2, RoundingMode.HALF_UP);
        BigDecimal refunded = order.getRefundedAmount() == null ? BigDecimal.ZERO : order.getRefundedAmount();
        BigDecimal refundable = order.getTotalAmount().subtract(refunded);
        if (amount.compareTo(refundable) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Refund amount exceeds refundable balance");
        }

        User admin = userRepository.findById(SecurityUtils.currentUserId()).orElse(null);
        OrderRefund refund = OrderRefund.builder()
                .order(order)
                .adminUser(admin)
                .amount(amount)
                .reason(request.reason().trim())
                .status(RefundStatus.PENDING)
                .build();
        order.getRefunds().add(refund);

        try {
            if (paymentModeService.isDevPaymentIntent(order.getStripePaymentIntentId())) {
                refund.setProviderRefundId("dev-refund-" + order.getId() + "-" + (order.getRefunds().size()));
                refund.setStatus(RefundStatus.SUCCEEDED);
                refund.setProviderMessage("Simulated development refund");
            } else {
                Refund stripeRefund = stripePaymentService.refundPayment(
                        order.getStripePaymentIntentId(),
                        amount,
                        request.reason().trim());
                refund.setProviderRefundId(stripeRefund.getId());
                refund.setStatus(mapRefundStatus(stripeRefund.getStatus()));
                refund.setProviderMessage(stripeRefund.getStatus());
            }
        } catch (RuntimeException e) {
            refund.setStatus(RefundStatus.FAILED);
            refund.setProviderMessage(e.getMessage());
            appendTimeline(order, admin, "REFUND_FAILED", order.getStatus(), order.getStatus(),
                    null, null, "Refund failed: " + e.getMessage());
        }

        if (refund.getStatus() == RefundStatus.SUCCEEDED) {
            order.setRefundedAmount(refunded.add(amount));
            if (order.getRefundedAmount().compareTo(order.getTotalAmount()) >= 0) {
                order.setStatus(OrderStatus.REFUNDED);
            }
        }
        appendTimeline(order, admin, "REFUND_" + refund.getStatus(), order.getStatus(), order.getStatus(),
                null, null, "Refund " + amount + ": " + request.reason().trim());
        Order saved = orderRepository.save(order);
        log.info("Admin refunded order orderId={} amount={} status={}", saved.getId(), amount, refund.getStatus());
        return EntityMapper.toOrderResponse(saved, true);
    }

    @Transactional
    public int cancelAbandonedOrders() {
        Instant cutoff = Instant.now().minus(abandonedTimeoutMinutes, ChronoUnit.MINUTES);
        List<Order> abandoned = orderRepository.findByStatusAndCreatedAtBefore(OrderStatus.AWAITING_PAYMENT, cutoff);
        for (Order order : abandoned) {
            order.setStatus(OrderStatus.CANCELLED);
            appendTimeline(order, null, "AUTO_CANCELLED", OrderStatus.AWAITING_PAYMENT, OrderStatus.CANCELLED,
                    null, null, "Unpaid checkout expired after " + abandonedTimeoutMinutes + " minutes.");
        }
        if (!abandoned.isEmpty()) {
            orderRepository.saveAll(abandoned);
            log.info("Auto-cancelled abandoned unpaid orders count={}", abandoned.size());
        }
        return abandoned.size();
    }

    private void applyFulfillmentTimestamps(Order order, OrderStatus status) {
        Instant now = Instant.now();
        if (status == OrderStatus.PACKED && order.getPackedAt() == null) {
            order.setPackedAt(now);
        }
        if (status == OrderStatus.SHIPPED) {
            if (order.getPackedAt() == null) {
                order.setPackedAt(now);
            }
            if (order.getShippedAt() == null) {
                order.setShippedAt(now);
            }
        }
        if (status == OrderStatus.DELIVERED) {
            if (order.getPackedAt() == null) {
                order.setPackedAt(now);
            }
            if (order.getShippedAt() == null) {
                order.setShippedAt(now);
            }
            if (order.getDeliveredAt() == null) {
                order.setDeliveredAt(now);
            }
        }
    }

    private void appendTimeline(Order order, User admin, String action, OrderStatus from, OrderStatus to,
                                String carrier, String trackingNumber, String note) {
        OrderTimelineEvent event = OrderTimelineEvent.builder()
                .order(order)
                .adminUser(admin)
                .action(action)
                .fromStatus(from)
                .toStatus(to)
                .shippingCarrier(carrier)
                .trackingNumber(trackingNumber)
                .note(note)
                .build();
        order.getTimelineEvents().add(event);
    }

    private void markShipmentEmailSent(Long orderId, Long userId, boolean sent) {
        if (!sent) {
            log.warn("Shipment email failed orderId={} userId={}", orderId, userId);
            return;
        }
        orderRepository.findById(orderId).ifPresent(order -> {
            order.setShipmentEmailSent(true);
            orderRepository.save(order);
        });
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private RefundStatus mapRefundStatus(String status) {
        if (status == null) {
            return RefundStatus.PENDING;
        }
        return switch (status.toLowerCase()) {
            case "succeeded" -> RefundStatus.SUCCEEDED;
            case "failed" -> RefundStatus.FAILED;
            case "canceled", "cancelled" -> RefundStatus.CANCELLED;
            default -> RefundStatus.PENDING;
        };
    }

    private void validateProductAvailability(Product product, ProductVariant variant, int quantity) {
        if (!product.isActive()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Product '" + product.getName() + "' is no longer available");
        }
        if (variant == null && !product.getVariants().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Select a variant for '" + product.getName() + "'");
        }
        if (variant != null && !variant.isActive()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Variant for '" + product.getName() + "' is no longer available");
        }
        int available = variant == null ? product.getStockQuantity() : variant.getStockQuantity();
        if (available < quantity) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Insufficient stock for '" + product.getName() + "'");
        }
    }

    private ProductVariant lockVariant(OrderItem item) {
        if (item.getVariant() == null) {
            return null;
        }
        return productVariantRepository.findByIdForUpdate(item.getVariant().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product variant not found"));
    }

    private void syncAggregateStock(Product product) {
        int total = product.getVariants().stream()
                .filter(ProductVariant::isActive)
                .mapToInt(ProductVariant::getStockQuantity)
                .sum();
        product.setStockQuantity(total);
    }
}
