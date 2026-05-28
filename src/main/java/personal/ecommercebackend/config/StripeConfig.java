package personal.ecommercebackend.config;

import com.stripe.Stripe;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;

@Configuration
@RequiredArgsConstructor
public class StripeConfig {

    private final StripeProperties stripeProperties;

    @PostConstruct
    void init() {
        if (stripeProperties.apiKey() != null && !stripeProperties.apiKey().isBlank()) {
            Stripe.apiKey = stripeProperties.apiKey();
        }
    }
}
