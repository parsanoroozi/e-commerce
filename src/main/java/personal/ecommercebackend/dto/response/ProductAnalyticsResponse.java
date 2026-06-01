package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;

public record ProductAnalyticsResponse(
        Long productId,
        String productName,
        String sku,
        int stockQuantity,
        long unitsSold,
        BigDecimal revenue
) {}
