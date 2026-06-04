package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record ProductVariantRequest(
        Long id,
        @Size(max = 100) String sku,
        Map<@Size(max = 80) String, @Size(max = 255) String> attributes,
        @Min(0) Integer stockQuantity,
        Boolean active
) {}
