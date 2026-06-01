package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProductImageRequest(
        @NotBlank @Size(max = 500) String url,
        @Size(max = 180) String altText,
        Integer sortOrder,
        Boolean primaryImage
) {
}
