package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ShippingAddressRequest(
        @Size(max = 50) String label,
        @NotBlank @Size(max = 200) String street,
        @NotBlank @Size(max = 100) String city,
        @NotBlank @Size(max = 20) String zipCode,
        @NotBlank @Size(max = 100) String country,
        Double latitude,
        Double longitude,
        Boolean isDefault
) {}
