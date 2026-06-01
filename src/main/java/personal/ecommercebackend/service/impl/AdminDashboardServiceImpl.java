package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.response.AdminDashboardResponse;
import personal.ecommercebackend.dto.response.AnalyticsPointResponse;
import personal.ecommercebackend.dto.response.FunnelStepResponse;
import personal.ecommercebackend.dto.response.OrderResponse;
import personal.ecommercebackend.dto.response.ProductAnalyticsResponse;
import personal.ecommercebackend.dto.response.ProductResponse;
import personal.ecommercebackend.entity.Order;
import personal.ecommercebackend.entity.OrderItem;
import personal.ecommercebackend.entity.OrderStatus;
import personal.ecommercebackend.entity.Product;
import personal.ecommercebackend.entity.RefundStatus;
import personal.ecommercebackend.entity.Role;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.OrderRepository;
import personal.ecommercebackend.repository.ProductRepository;
import personal.ecommercebackend.repository.UserRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final ShopSettingsService shopSettingsService;

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        int threshold = shopSettingsService.getLowStockThreshold();
        List<Order> all = orderRepository.findAllWithItemsAndRefunds();
        List<User> users = userRepository.findAll();
        Instant startOfDay = LocalDate.now().atStartOfDay().toInstant(ZoneOffset.UTC);
        List<Order> paidOrders = all.stream().filter(this::isRevenueOrder).toList();

        long pending = all.stream().filter(o -> o.getStatus() == OrderStatus.AWAITING_PAYMENT
                || o.getStatus() == OrderStatus.PENDING).count();

        BigDecimal revenueTotal = paidOrders.stream()
                .map(this::netOrderRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal revenueToday = paidOrders.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isAfter(startOfDay))
                .map(this::netOrderRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal averageOrderValue = paidOrders.isEmpty()
                ? BigDecimal.ZERO
                : revenueTotal.divide(BigDecimal.valueOf(paidOrders.size()), 2, RoundingMode.HALF_UP);

        List<Product> lowStock = productRepository
                .findByActiveTrueAndStockQuantityLessThanEqualOrderByStockQuantityAsc(
                        threshold, PageRequest.of(0, 5));

        List<OrderResponse> recent = orderRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5))
                .map(o -> EntityMapper.toOrderResponse(o, true))
                .getContent();

        List<ProductResponse> lowStockResponses = lowStock.stream()
                .map(EntityMapper::toProductResponse)
                .toList();

        return new AdminDashboardResponse(
                all.size(),
                pending,
                productRepository.countByActiveTrueAndStockQuantityLessThanEqual(threshold),
                threshold,
                revenueToday,
                revenueTotal,
                averageOrderValue,
                revenueByDay(paidOrders),
                revenueByWeek(paidOrders),
                revenueByMonth(paidOrders),
                bestSellingProducts(paidOrders),
                lowStockHighDemandProducts(paidOrders, threshold),
                newCustomersByDay(users),
                conversionFunnel(all),
                lowStockResponses,
                recent
        );
    }

    private boolean isRevenueOrder(Order order) {
        return order.getStatus() == OrderStatus.CONFIRMED
                || order.getStatus() == OrderStatus.PACKED
                || order.getStatus() == OrderStatus.SHIPPED
                || order.getStatus() == OrderStatus.DELIVERED
                || order.getStatus() == OrderStatus.REFUNDED;
    }

    private BigDecimal netOrderRevenue(Order order) {
        BigDecimal total = order.getTotalAmount() == null ? BigDecimal.ZERO : order.getTotalAmount();
        BigDecimal refunded = order.getRefundedAmount() == null ? BigDecimal.ZERO : order.getRefundedAmount();
        return total.subtract(refunded).max(BigDecimal.ZERO);
    }

    private List<AnalyticsPointResponse> revenueByDay(List<Order> orders) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Map<LocalDate, List<Order>> byDate = orders.stream()
                .filter(order -> order.getCreatedAt() != null)
                .filter(order -> !order.getCreatedAt().isBefore(today.minusDays(13).atStartOfDay().toInstant(ZoneOffset.UTC)))
                .collect(Collectors.groupingBy(order -> LocalDate.ofInstant(order.getCreatedAt(), ZoneOffset.UTC)));
        List<AnalyticsPointResponse> points = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            points.add(orderPoint(date.format(DateTimeFormatter.ISO_LOCAL_DATE), byDate.getOrDefault(date, List.of())));
        }
        return points;
    }

    private List<AnalyticsPointResponse> revenueByWeek(List<Order> orders) {
        WeekFields weekFields = WeekFields.of(Locale.US);
        Map<String, List<Order>> byWeek = orders.stream()
                .filter(order -> order.getCreatedAt() != null)
                .filter(order -> !order.getCreatedAt().isBefore(LocalDate.now(ZoneOffset.UTC).minusWeeks(11).atStartOfDay().toInstant(ZoneOffset.UTC)))
                .collect(Collectors.groupingBy(order -> {
                    LocalDate date = LocalDate.ofInstant(order.getCreatedAt(), ZoneOffset.UTC);
                    return date.getYear() + "-W" + String.format("%02d", date.get(weekFields.weekOfWeekBasedYear()));
                }));
        List<AnalyticsPointResponse> points = new ArrayList<>();
        LocalDate now = LocalDate.now(ZoneOffset.UTC);
        for (int i = 11; i >= 0; i--) {
            LocalDate date = now.minusWeeks(i);
            String label = date.getYear() + "-W" + String.format("%02d", date.get(weekFields.weekOfWeekBasedYear()));
            points.add(orderPoint(label, byWeek.getOrDefault(label, List.of())));
        }
        return points;
    }

    private List<AnalyticsPointResponse> revenueByMonth(List<Order> orders) {
        Map<String, List<Order>> byMonth = orders.stream()
                .filter(order -> order.getCreatedAt() != null)
                .filter(order -> !order.getCreatedAt().isBefore(LocalDate.now(ZoneOffset.UTC).minusMonths(11).withDayOfMonth(1).atStartOfDay().toInstant(ZoneOffset.UTC)))
                .collect(Collectors.groupingBy(order -> {
                    LocalDate date = LocalDate.ofInstant(order.getCreatedAt(), ZoneOffset.UTC);
                    return date.format(DateTimeFormatter.ofPattern("yyyy-MM"));
                }));
        List<AnalyticsPointResponse> points = new ArrayList<>();
        LocalDate now = LocalDate.now(ZoneOffset.UTC).withDayOfMonth(1);
        for (int i = 11; i >= 0; i--) {
            String label = now.minusMonths(i).format(DateTimeFormatter.ofPattern("yyyy-MM"));
            points.add(orderPoint(label, byMonth.getOrDefault(label, List.of())));
        }
        return points;
    }

    private AnalyticsPointResponse orderPoint(String label, List<Order> orders) {
        BigDecimal revenue = orders.stream().map(this::netOrderRevenue).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new AnalyticsPointResponse(label, revenue, orders.size(), 0);
    }

    private List<ProductAnalyticsResponse> bestSellingProducts(List<Order> orders) {
        return productAnalytics(orders).values().stream()
                .sorted(Comparator.comparingLong(ProductAccumulator::unitsSold).reversed())
                .limit(5)
                .map(ProductAccumulator::toResponse)
                .toList();
    }

    private List<ProductAnalyticsResponse> lowStockHighDemandProducts(List<Order> orders, int threshold) {
        Set<Long> lowStockIds = productRepository
                .findByActiveTrueAndStockQuantityLessThanEqualOrderByStockQuantityAsc(threshold, PageRequest.of(0, 100))
                .stream()
                .map(Product::getId)
                .collect(Collectors.toSet());
        return productAnalytics(orders).values().stream()
                .filter(acc -> lowStockIds.contains(acc.productId()))
                .sorted(Comparator.comparingLong(ProductAccumulator::unitsSold).reversed())
                .limit(5)
                .map(ProductAccumulator::toResponse)
                .toList();
    }

    private Map<Long, ProductAccumulator> productAnalytics(List<Order> orders) {
        Map<Long, ProductAccumulator> products = new LinkedHashMap<>();
        for (Order order : orders) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                ProductAccumulator acc = products.computeIfAbsent(product.getId(),
                        id -> new ProductAccumulator(product.getId(), item.getProductName(), item.getSku(), product.getStockQuantity()));
                acc.add(item.getQuantity(), item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity())));
            }
        }
        return products;
    }

    private List<AnalyticsPointResponse> newCustomersByDay(List<User> users) {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        Map<LocalDate, Long> byDate = users.stream()
                .filter(user -> user.getRole() == Role.CUSTOMER)
                .filter(user -> user.getCreatedAt() != null)
                .filter(user -> !user.getCreatedAt().isBefore(today.minusDays(13).atStartOfDay().toInstant(ZoneOffset.UTC)))
                .collect(Collectors.groupingBy(user -> LocalDate.ofInstant(user.getCreatedAt(), ZoneOffset.UTC), Collectors.counting()));
        List<AnalyticsPointResponse> points = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            points.add(new AnalyticsPointResponse(date.format(DateTimeFormatter.ISO_LOCAL_DATE), BigDecimal.ZERO, 0, byDate.getOrDefault(date, 0L)));
        }
        return points;
    }

    private List<FunnelStepResponse> conversionFunnel(List<Order> orders) {
        long checkouts = orders.size();
        long paid = orders.stream().filter(this::isRevenueOrder).count();
        long shipped = orders.stream().filter(order -> order.getStatus() == OrderStatus.SHIPPED
                || order.getStatus() == OrderStatus.DELIVERED).count();
        long delivered = orders.stream().filter(order -> order.getStatus() == OrderStatus.DELIVERED).count();
        long cancelled = orders.stream().filter(order -> order.getStatus() == OrderStatus.CANCELLED).count();
        long refunded = orders.stream().filter(order -> order.getRefundedAmount() != null
                && order.getRefundedAmount().compareTo(BigDecimal.ZERO) > 0).count();
        return List.of(
                funnelStep("Checkout started", checkouts, checkouts),
                funnelStep("Paid orders", paid, checkouts),
                funnelStep("Shipped orders", shipped, paid),
                funnelStep("Delivered orders", delivered, paid),
                funnelStep("Cancelled orders", cancelled, checkouts),
                funnelStep("Refunded orders", refunded, paid)
        );
    }

    private FunnelStepResponse funnelStep(String label, long count, long base) {
        BigDecimal rate = base == 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(count)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(base), 2, RoundingMode.HALF_UP);
        return new FunnelStepResponse(label, count, rate);
    }

    private static final class ProductAccumulator {
        private final Long productId;
        private final String productName;
        private final String sku;
        private final int stockQuantity;
        private long unitsSold;
        private BigDecimal revenue = BigDecimal.ZERO;

        private ProductAccumulator(Long productId, String productName, String sku, int stockQuantity) {
            this.productId = productId;
            this.productName = productName;
            this.sku = sku;
            this.stockQuantity = stockQuantity;
        }

        private Long productId() {
            return productId;
        }

        private long unitsSold() {
            return unitsSold;
        }

        private void add(int quantity, BigDecimal lineRevenue) {
            unitsSold += quantity;
            revenue = revenue.add(lineRevenue);
        }

        private ProductAnalyticsResponse toResponse() {
            return new ProductAnalyticsResponse(productId, productName, sku, stockQuantity, unitsSold, revenue);
        }
    }
}
