package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record InventoryAdjustmentRequest(
        @NotNull Long productId,
        Long variantId,
        @NotNull Integer quantityDelta,
        @NotBlank @Size(max = 500) String reason
) {}
