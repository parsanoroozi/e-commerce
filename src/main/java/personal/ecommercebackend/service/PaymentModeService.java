package personal.ecommercebackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import personal.ecommercebackend.config.PaymentProperties;

@Service
@RequiredArgsConstructor
public class PaymentModeService {

    public static final String DEV_PAYMENT_PREFIX = "dev-";

    private final PaymentProperties paymentProperties;
    private final StripePaymentService stripePaymentService;

    public boolean isStripeEnabled() {
        return stripePaymentService.isConfigured();
    }

    /** Demo checkout when Stripe keys are missing and dev mode is on (default for local dev). */
    public boolean isDevModeActive() {
        return paymentProperties.devMode() && !stripePaymentService.isConfigured();
    }

    public boolean isDevPaymentIntent(String paymentIntentId) {
        return paymentIntentId != null && paymentIntentId.startsWith(DEV_PAYMENT_PREFIX);
    }

    public String devPaymentIntentId(Long orderId) {
        return DEV_PAYMENT_PREFIX + orderId;
    }
}
