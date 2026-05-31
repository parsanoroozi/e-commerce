package personal.ecommercebackend.dto.response;

public record MapSearchResultResponse(
        String displayName,
        double latitude,
        double longitude,
        String street,
        String city,
        String postalCode,
        String country
) {}
