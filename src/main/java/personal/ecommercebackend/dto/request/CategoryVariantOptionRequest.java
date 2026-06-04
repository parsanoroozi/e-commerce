package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryVariantOptionRequest(
        @NotBlank @Size(max = 80) String name,
        Integer displayOrder
) {
}
