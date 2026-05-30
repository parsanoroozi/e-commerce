package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.response.AdminDashboardResponse;
import personal.ecommercebackend.dto.response.OrderResponse;
import personal.ecommercebackend.dto.response.ProductResponse;
import personal.ecommercebackend.entity.Order;
import personal.ecommercebackend.entity.OrderStatus;
import personal.ecommercebackend.entity.Product;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.OrderRepository;
import personal.ecommercebackend.repository.ProductRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminDashboardServiceImpl implements AdminDashboardService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ShopSettingsService shopSettingsService;

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard() {
        int threshold = shopSettingsService.getLowStockThreshold();
        List<Order> all = orderRepository.findAll();
        Instant startOfDay = LocalDate.now().atStartOfDay().toInstant(ZoneOffset.UTC);

        long pending = all.stream().filter(o -> o.getStatus() == OrderStatus.AWAITING_PAYMENT
                || o.getStatus() == OrderStatus.PENDING).count();

        BigDecimal revenueTotal = all.stream()
                .filter(o -> o.getStatus() == OrderStatus.CONFIRMED
                        || o.getStatus() == OrderStatus.SHIPPED
                        || o.getStatus() == OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal revenueToday = all.stream()
                .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().isAfter(startOfDay))
                .filter(o -> o.getStatus() == OrderStatus.CONFIRMED
                        || o.getStatus() == OrderStatus.SHIPPED
                        || o.getStatus() == OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

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
                lowStockResponses,
                recent
        );
    }
}
