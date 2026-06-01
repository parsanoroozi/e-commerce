package personal.ecommercebackend.dto.response;

import java.time.Instant;

public record InventoryAdjustmentResponse(
        Long id,
        Long productId,
        String productName,
        Long variantId,
        String variantName,
        String sku,
        Integer quantityDelta,
        Integer stockBefore,
        Integer stockAfter,
        String reason,
        String adminEmail,
        Instant createdAt
) {}
