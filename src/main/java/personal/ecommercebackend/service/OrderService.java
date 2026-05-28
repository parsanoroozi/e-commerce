package personal.ecommercebackend.service;

import com.stripe.model.PaymentIntent;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.ResolvedShipping;
import personal.ecommercebackend.dto.request.CheckoutRequest;
import personal.ecommercebackend.dto.request.OrderStatusUpdateRequest;
import personal.ecommercebackend.dto.response.CheckoutInitResponse;
import personal.ecommercebackend.dto.response.OrderResponse;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.dto.response.PaymentConfigResponse;
import personal.ecommercebackend.entity.*;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.CartRepository;
import personal.ecommercebackend.repository.OrderRepository;
import personal.ecommercebackend.repository.UserRepository;
import personal.ecommercebackend.security.SecurityUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductService productService;
    private final StripePaymentService stripePaymentService;
    private final PaymentModeService paymentModeService;
    private final EmailService emailService;
    private final ShippingAddressService shippingAddressService;

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

        List<OrderItem> orderItems = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (CartItem cartItem : cart.getItems()) {
            Product product = productService.getProduct(cartItem.getProduct().getId());
            validateProductAvailability(product, cartItem.getQuantity());

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .productName(product.getName())
                    .quantity(cartItem.getQuantity())
                    .unitPrice(product.getPrice())
                    .build();

            orderItems.add(orderItem);
            total = total.add(product.getPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }

        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.AWAITING_PAYMENT)
                .totalAmount(total)
                .shippingStreet(shipping.street())
                .shippingCity(shipping.city())
                .shippingZipCode(shipping.zipCode())
                .shippingCountry(shipping.country())
                .items(new ArrayList<>())
                .confirmationEmailSent(false)
                .build();

        for (OrderItem item : orderItems) {
            item.setOrder(order);
            order.getItems().add(item);
        }

        Order saved = orderRepository.save(order);

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
    public OrderResponse confirmPayment(Long orderId) {
        Order order = orderRepository.findWithDetailsByIdAndUserId(orderId, SecurityUtils.currentUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));

        if (order.getStatus() == OrderStatus.CONFIRMED) {
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
        Order order = orderRepository.findWithDetailsByStripePaymentIntentId(paymentIntentId)
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
            Product product = productService.getProduct(item.getProduct().getId());
            if (product.getStockQuantity() < item.getQuantity()) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "Insufficient stock for '" + product.getName() + "'");
            }
            product.setStockQuantity(product.getStockQuantity() - item.getQuantity());
        }

        cartRepository.findByUserId(order.getUser().getId()).ifPresent(cart -> cart.getItems().clear());

        order.setStatus(OrderStatus.CONFIRMED);
        Order saved = orderRepository.save(order);

        if (!saved.isConfirmationEmailSent()) {
            try {
                emailService.sendOrderConfirmation(saved, saved.getUser());
                saved.setConfirmationEmailSent(true);
                orderRepository.save(saved);
            } catch (RuntimeException e) {
                // Order is paid; email failure should not roll back payment fulfillment
            }
        }

        return saved;
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
        Order order = orderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Order not found"));
        if (order.getStatus() == OrderStatus.AWAITING_PAYMENT) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Cannot update status until payment is completed");
        }
        order.setStatus(request.status());
        return EntityMapper.toOrderResponse(orderRepository.save(order), true);
    }

    private void validateProductAvailability(Product product, int quantity) {
        if (!product.isActive()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Product '" + product.getName() + "' is no longer available");
        }
        if (product.getStockQuantity() < quantity) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Insufficient stock for '" + product.getName() + "'");
        }
    }
}
