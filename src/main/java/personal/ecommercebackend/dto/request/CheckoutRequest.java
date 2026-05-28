package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.Size;

public record CheckoutRequest(
        Long shippingAddressId,
        @Size(max = 50) String label,
        @Size(max = 200) String shippingStreet,
        @Size(max = 100) String shippingCity,
        @Size(max = 20) String shippingZipCode,
        @Size(max = 100) String shippingCountry,
        @Size(max = 50) String couponCode,
        String shippingMethod
) {}
