package personal.ecommercebackend.dto.response;

public record ProductImageResponse(
        Long id,
        String url,
        String altText,
        int sortOrder,
        boolean primaryImage
) {
}
