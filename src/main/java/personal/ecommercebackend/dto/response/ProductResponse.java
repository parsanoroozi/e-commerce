package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record ProductResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        String sku,
        String slug,
        String metaTitle,
        String metaDescription,
        Integer stockQuantity,
        String imageUrl,
        List<String> images,
        List<ProductImageResponse> imageDetails,
        List<ProductVariantResponse> variants,
        Long categoryId,
        String categoryName,
        boolean active,
        boolean featured,
        Instant visibleFrom,
        Instant visibleUntil,
        Double averageRating,
        Long reviewCount
) {}
