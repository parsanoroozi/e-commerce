package personal.ecommercebackend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ProductImageOrderRequest(
        @NotEmpty List<@Valid Item> images
) {
    public record Item(
            @NotNull Long id,
            @NotNull Integer sortOrder
    ) {
    }
}
