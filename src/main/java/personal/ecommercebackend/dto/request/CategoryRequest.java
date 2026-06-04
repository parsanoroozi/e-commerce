package personal.ecommercebackend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record CategoryRequest(
        @NotBlank @Size(max = 100) String name,
        @Size(max = 500) String description,
        Integer displayOrder,
        Long parentId,
        @Min(1) @Max(10000) Integer lowStockThreshold,
        @DecimalMin("0.0000") BigDecimal taxRate,
        List<@Valid CategoryVariantOptionRequest> variantOptions
) {}
