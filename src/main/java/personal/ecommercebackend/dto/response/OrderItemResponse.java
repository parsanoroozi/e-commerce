package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long productId,
        Long variantId,
        String productName,
        String variantName,
        String sku,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal
) {}
