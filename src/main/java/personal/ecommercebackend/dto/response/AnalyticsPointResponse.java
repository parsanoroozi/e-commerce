package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;

public record AnalyticsPointResponse(
        String label,
        BigDecimal revenue,
        long orderCount,
        long customerCount
) {}
