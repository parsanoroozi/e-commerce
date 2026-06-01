package personal.ecommercebackend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.request.CustomerManagementRequest;
import personal.ecommercebackend.dto.request.ForgotPasswordRequest;
import personal.ecommercebackend.dto.response.CustomerDetailResponse;
import personal.ecommercebackend.dto.response.CustomerSummaryResponse;
import personal.ecommercebackend.dto.response.OrderResponse;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.entity.Order;
import personal.ecommercebackend.entity.OrderStatus;
import personal.ecommercebackend.entity.Role;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.*;
import personal.ecommercebackend.security.SecurityUtils;
import personal.ecommercebackend.service.AdminUserService;
import personal.ecommercebackend.service.AuthService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ShippingAddressRepository shippingAddressRepository;
    private final ProductReviewRepository productReviewRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final NotificationRepository notificationRepository;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public PageResponse<CustomerSummaryResponse> list(Pageable pageable) {
        return PageResponse.from(userRepository
                .findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toSummary));
    }

    @Transactional(readOnly = true)
    public CustomerDetailResponse detail(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        List<Order> orders = sortedOrders(id);
        List<OrderResponse> orderResponses = orders.stream()
                .map(order -> EntityMapper.toOrderResponse(order, false))
                .toList();
        BigDecimal lifetimeSpend = lifetimeSpend(orders);
        BigDecimal averageOrderValue = paidOrderCount(orders) == 0
                ? BigDecimal.ZERO
                : lifetimeSpend.divide(BigDecimal.valueOf(paidOrderCount(orders)), 2, RoundingMode.HALF_UP);
        return new CustomerDetailResponse(
                toSummary(user, orders),
                user.getCustomerNotes(),
                averageOrderValue,
                orderResponses);
    }

    @Transactional
    public CustomerDetailResponse updateCustomer(Long id, CustomerManagementRequest request) {
        if (id.equals(SecurityUtils.currentUserId()) && Boolean.TRUE.equals(request.blocked())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot block your own admin account");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        if (request.blocked() != null) {
            user.setBlocked(request.blocked());
        }
        if (request.customerNotes() != null) {
            user.setCustomerNotes(normalizeOptional(request.customerNotes()));
        }
        if (request.customerSegment() != null) {
            user.setCustomerSegment(normalizeOptional(request.customerSegment()));
        }
        if (request.role() != null) {
            if (id.equals(SecurityUtils.currentUserId()) && request.role() != Role.ADMIN) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot remove your own super admin role");
            }
            user.setRole(request.role());
        }
        userRepository.save(user);
        return detail(id);
    }

    @Transactional
    public void sendPasswordReset(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        authService.forgotPassword(new ForgotPasswordRequest(user.getEmail()));
    }

    @Transactional
    public void delete(Long id) {
        if (id.equals(SecurityUtils.currentUserId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot delete your own admin account");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        if (orderRepository.existsByUserId(id)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Users with order history cannot be deleted. Disable or anonymize the account instead.");
        }

        notificationRepository.deleteByUserId(id);
        passwordResetTokenRepository.deleteByUserId(id);
        productReviewRepository.deleteByUserId(id);
        wishlistItemRepository.deleteByUserId(id);
        shippingAddressRepository.deleteByUserId(id);
        cartRepository.deleteByUserId(id);
        userRepository.delete(user);
    }

    private CustomerSummaryResponse toSummary(User user) {
        return toSummary(user, sortedOrders(user.getId()));
    }

    private CustomerSummaryResponse toSummary(User user, List<Order> orders) {
        BigDecimal lifetimeSpend = lifetimeSpend(orders);
        return new CustomerSummaryResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getMobileNumber(),
                user.getRole(),
                user.isBlocked(),
                user.getCustomerSegment(),
                computedSegments(user, orders, lifetimeSpend),
                orders.size(),
                lifetimeSpend,
                user.getCreatedAt()
        );
    }

    private List<Order> sortedOrders(Long userId) {
        return orderRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparing(Order::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    private BigDecimal lifetimeSpend(List<Order> orders) {
        return orders.stream()
                .filter(this::isRevenueOrder)
                .map(order -> {
                    BigDecimal total = order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount();
                    BigDecimal refunded = order.getRefundedAmount() == null ? BigDecimal.ZERO : order.getRefundedAmount();
                    return total.subtract(refunded).max(BigDecimal.ZERO);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private long paidOrderCount(List<Order> orders) {
        return orders.stream().filter(this::isRevenueOrder).count();
    }

    private boolean isRevenueOrder(Order order) {
        return order.getStatus() == OrderStatus.CONFIRMED
                || order.getStatus() == OrderStatus.PACKED
                || order.getStatus() == OrderStatus.SHIPPED
                || order.getStatus() == OrderStatus.DELIVERED
                || order.getStatus() == OrderStatus.REFUNDED;
    }

    private List<String> computedSegments(User user, List<Order> orders, BigDecimal lifetimeSpend) {
        List<String> segments = new ArrayList<>();
        if (user.isBlocked()) {
            segments.add("Blocked");
        }
        if (user.getRole() != Role.CUSTOMER) {
            segments.add("Staff");
        }
        if (orders.isEmpty()) {
            segments.add("No orders");
        } else if (orders.size() >= 5) {
            segments.add("Repeat buyer");
        }
        if (lifetimeSpend.compareTo(BigDecimal.valueOf(500)) >= 0) {
            segments.add("VIP");
        }
        if (orders.stream().anyMatch(order -> order.getStatus() == OrderStatus.REFUNDED
                || (order.getRefundedAmount() != null && order.getRefundedAmount().compareTo(BigDecimal.ZERO) > 0))) {
            segments.add("Refund history");
        }
        return segments;
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
