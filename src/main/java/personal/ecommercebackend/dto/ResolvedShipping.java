package personal.ecommercebackend.dto;

public record ResolvedShipping(
        String street,
        String city,
        String zipCode,
        String country,
        Double latitude,
        Double longitude
) {}
