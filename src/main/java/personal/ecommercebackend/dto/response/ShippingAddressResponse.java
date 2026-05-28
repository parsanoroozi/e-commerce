package personal.ecommercebackend.dto.response;

import java.time.Instant;

public record ShippingAddressResponse(
        Long id,
        String label,
        String street,
        String city,
        String zipCode,
        String country,
        boolean isDefault,
        Instant lastUsedAt
) {}
