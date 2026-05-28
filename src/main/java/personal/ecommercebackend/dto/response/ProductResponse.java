package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record ProductResponse(
        Long id,
        String name,
        String description,
        BigDecimal price,
        Integer stockQuantity,
        String imageUrl,
        List<String> images,
        Long categoryId,
        String categoryName,
        boolean active,
        Double averageRating,
        Long reviewCount
) {}
