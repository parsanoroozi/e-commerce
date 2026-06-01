package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.PaymentIntentUpdateParams;
import com.stripe.param.RefundCreateParams;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import personal.ecommercebackend.config.StripeProperties;
import personal.ecommercebackend.entity.Order;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.exception.ApiException;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class StripePaymentServiceImpl implements StripePaymentService {

    private final StripeProperties stripeProperties;

    public PaymentIntent createPaymentIntent(Order order, User user) {
        ensureConfigured();
        long amountCents = toCents(order.getTotalAmount());
        try {
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountCents)
                    .setCurrency(stripeProperties.currency())
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder()
                                    .setEnabled(true)
                                    .build())
                    .putMetadata("orderId", order.getId().toString())
                    .setReceiptEmail(user.getEmail())
                    .setDescription("ShopVerse order #" + order.getId())
                    .build();
            return PaymentIntent.create(params);
        } catch (StripeException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Payment provider error: " + e.getMessage());
        }
    }

    public PaymentIntent retrievePaymentIntent(String paymentIntentId) {
        ensureConfigured();
        try {
            return PaymentIntent.retrieve(paymentIntentId);
        } catch (StripeException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Payment provider error: " + e.getMessage());
        }
    }

    public PaymentIntent updatePaymentIntentAmount(String paymentIntentId, BigDecimal amount) {
        ensureConfigured();
        try {
            PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
            PaymentIntentUpdateParams params = PaymentIntentUpdateParams.builder()
                    .setAmount(toCents(amount))
                    .build();
            return intent.update(params);
        } catch (StripeException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Payment provider error: " + e.getMessage());
        }
    }

    public Refund refundPayment(String paymentIntentId, BigDecimal amount, String reason) {
        ensureConfigured();
        try {
            RefundCreateParams params = RefundCreateParams.builder()
                    .setPaymentIntent(paymentIntentId)
                    .setAmount(toCents(amount))
                    .setReason(RefundCreateParams.Reason.REQUESTED_BY_CUSTOMER)
                    .putMetadata("reason", reason)
                    .build();
            return Refund.create(params);
        } catch (StripeException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Refund provider error: " + e.getMessage());
        }
    }

    public boolean isPaymentSucceeded(PaymentIntent intent) {
        return "succeeded".equals(intent.getStatus());
    }

    public String publishableKey() {
        return stripeProperties.publishableKey();
    }

    public boolean isConfigured() {
        return stripeProperties.apiKey() != null
                && !stripeProperties.apiKey().isBlank()
                && stripeProperties.publishableKey() != null
                && !stripeProperties.publishableKey().isBlank();
    }

    private void ensureConfigured() {
        if (!isConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY.");
        }
    }

    private long toCents(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .longValueExact();
    }
}
