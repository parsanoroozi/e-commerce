package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record CustomerDetailResponse(
        CustomerSummaryResponse customer,
        String customerNotes,
        BigDecimal averageOrderValue,
        List<OrderResponse> orders
) {}
