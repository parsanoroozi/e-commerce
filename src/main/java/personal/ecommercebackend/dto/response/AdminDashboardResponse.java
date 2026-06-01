package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardResponse(
        long totalOrders,
        long pendingOrders,
        long lowStockProducts,
        int lowStockThreshold,
        BigDecimal revenueToday,
        BigDecimal revenueTotal,
        BigDecimal averageOrderValue,
        List<AnalyticsPointResponse> revenueByDay,
        List<AnalyticsPointResponse> revenueByWeek,
        List<AnalyticsPointResponse> revenueByMonth,
        List<ProductAnalyticsResponse> bestSellingProducts,
        List<ProductAnalyticsResponse> lowStockHighDemandProducts,
        List<AnalyticsPointResponse> newCustomersByDay,
        List<FunnelStepResponse> conversionFunnel,
        List<ProductResponse> lowStockItems,
        List<OrderResponse> recentOrders
) {}
