package personal.ecommercebackend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "stripe")
public record StripeProperties(
        String apiKey,
        String webhookSecret,
        String publishableKey,
        String currency
) {}
