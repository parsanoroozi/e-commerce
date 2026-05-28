package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardResponse(
        long totalOrders,
        long pendingOrders,
        long lowStockProducts,
        BigDecimal revenueToday,
        BigDecimal revenueTotal,
        List<ProductResponse> lowStockItems,
        List<OrderResponse> recentOrders
) {}
