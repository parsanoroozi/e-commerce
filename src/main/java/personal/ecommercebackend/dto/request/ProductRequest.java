package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 2000) String description,
        @NotNull @DecimalMin("0.01") BigDecimal price,
        @NotNull @Min(0) Integer stockQuantity,
        @Size(max = 500) String imageUrl,
        @NotNull Long categoryId,
        Boolean active
) {}
