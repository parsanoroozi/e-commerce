package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        int displayOrder,
        Long parentId,
        String parentName,
        int lowStockThreshold,
        BigDecimal taxRate,
        List<CategoryVariantOptionResponse> variantOptions
) {}
