package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record ProductVariantRequest(
        Long id,
        @Size(max = 100) String sku,
        @Size(max = 100) String size,
        @Size(max = 100) String color,
        @Size(max = 100) String material,
        @Min(0) Integer stockQuantity,
        Boolean active
) {}
