package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;

public record CartItemResponse(
        Long productId,
        String productName,
        String imageUrl,
        BigDecimal unitPrice,
        Integer quantity,
        BigDecimal lineTotal
) {}
