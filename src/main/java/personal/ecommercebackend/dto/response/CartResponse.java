package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(
        List<CartItemResponse> items,
        BigDecimal totalAmount,
        int totalItems
) {}
