package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record ProductResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        String sku,
        Integer stockQuantity,
        String imageUrl,
        List<String> images,
        List<ProductVariantResponse> variants,
        Long categoryId,
        String categoryName,
        boolean active,
        Double averageRating,
        Long reviewCount
) {}
