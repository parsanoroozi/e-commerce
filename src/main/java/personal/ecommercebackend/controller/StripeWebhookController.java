package personal.ecommercebackend.controller;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import personal.ecommercebackend.service.OrderService;

@RestController
@RequestMapping("/api/webhooks/stripe")
@RequiredArgsConstructor
@Slf4j
public class StripeWebhookController {

    private final OrderService orderService;

    @Value("${stripe.webhook-secret:}")
    private String webhookSecret;

    @PostMapping
    @ResponseStatus(HttpStatus.OK)
    public void handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature) {

        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("Stripe webhook received but stripe.webhook-secret is not set");
            return;
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, signature, webhookSecret);
        } catch (SignatureVerificationException e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Invalid webhook signature");
        }

        if ("payment_intent.succeeded".equals(event.getType())) {
            PaymentIntent intent = (PaymentIntent) event.getDataObjectDeserializer()
                    .getObject()
                    .orElse(null);
            if (intent != null) {
                orderService.fulfillByPaymentIntentId(intent.getId());
            }
        }
    }
}
