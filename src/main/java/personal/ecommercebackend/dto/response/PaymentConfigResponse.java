package personal.ecommercebackend.dto.response;

public record PaymentConfigResponse(String publishableKey, boolean stripeEnabled, boolean devMode) {}
