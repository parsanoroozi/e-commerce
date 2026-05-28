package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CheckoutRequest(
        @NotBlank @Size(max = 200) String shippingStreet,
        @NotBlank @Size(max = 100) String shippingCity,
        @NotBlank @Size(max = 20) String shippingZipCode,
        @NotBlank @Size(max = 100) String shippingCountry
) {}
