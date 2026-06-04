package personal.ecommercebackend.dto.response;

import java.util.Map;

public record ProductVariantResponse(
        Long id,
        String sku,
        Map<String, String> attributes,
        Integer stockQuantity,
        boolean active,
        String displayName
) {}
