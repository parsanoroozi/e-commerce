package personal.ecommercebackend.dto.response;

import java.time.Instant;

public record ShippingAddressResponse(
        Long id,
        String label,
        String street,
        String city,
        String zipCode,
        String country,
        Double latitude,
        Double longitude,
        boolean isDefault,
        Instant lastUsedAt
) {}
