package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.*;
import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.util.List;

public record ProductRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 2000) String description,
        @NotNull @DecimalMin("0.01") BigDecimal price,
        @Size(max = 100) String sku,
        @NotNull @Min(0) Integer stockQuantity,
        @Size(max = 500) String imageUrl,
        @NotNull Long categoryId,
        Boolean active,
        List<@Valid ProductVariantRequest> variants
) {}
