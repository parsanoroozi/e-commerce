package personal.ecommercebackend.dto.response;

public record ProductVariantResponse(
        Long id,
        String sku,
        String size,
        String color,
        String material,
        Integer stockQuantity,
        boolean active,
        String displayName
) {}
