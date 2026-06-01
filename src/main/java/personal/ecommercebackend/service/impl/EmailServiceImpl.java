package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import personal.ecommercebackend.dto.response.AdminSettingsResponse;
import personal.ecommercebackend.entity.Order;
import personal.ecommercebackend.entity.OrderItem;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.service.ShopSettingsService;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final AsyncEmailSender asyncEmailSender;
    private final ShopSettingsService shopSettingsService;

    @Value("${app.mail.from:noreply@shopverse.local}")
    private String fromAddress;

    @Value("${app.mail.from-name:ShopVerse}")
    private String fromName;

    public CompletableFuture<Boolean> sendOrderConfirmation(Order order, User user) {
        String subject = "Your ShopVerse order is confirmed";
        String body = wrapEmail(
                "Order confirmed",
                "Thanks for your purchase, " + escape(user.getFirstName()) + ".",
                """
                        <p>Your payment was received and your order is now confirmed.</p>
                        %s
                        %s
                        """.formatted(orderSummary(order), shippingBlock(order)));
        return asyncEmailSender.sendHtml(user.getEmail(), subject, body, "order confirmation #" + order.getId());
    }

    public CompletableFuture<Boolean> sendOrderShipped(Order order, User user) {
        String subject = "Your ShopVerse order is on the way";
        String body = wrapEmail(
                "Order shipped",
                "Good news, " + escape(user.getFirstName()) + ".",
                """
                        <p>Your order has shipped. Here is what is on the way:</p>
                        %s
                        %s
                        %s
                        """.formatted(trackingBlock(order), orderSummary(order), shippingBlock(order)));
        return asyncEmailSender.sendHtml(user.getEmail(), subject, body, "shipment notification #" + order.getId());
    }

    public CompletableFuture<Boolean> sendPasswordReset(User user, String resetLink) {
        String subject = "Reset your ShopVerse password";
        String body = wrapEmail(
                "Reset your password",
                "Hi " + escape(user.getFirstName()) + ",",
                """
                        <p>We received a request to reset your ShopVerse password. This link is valid for 1 hour.</p>
                        <p style="margin:24px 0;">
                          <a href="%s" style="display:inline-block;background:#ff5a1f;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:8px;">Reset password</a>
                        </p>
                        <p style="color:#64748b;">If you did not request this, you can ignore this email.</p>
                        """.formatted(escape(resetLink)));
        return asyncEmailSender.sendHtml(user.getEmail(), subject, body, "password reset for " + user.getEmail());
    }

    public CompletableFuture<Boolean> sendEmailVerificationCode(String email, String code) {
        String subject = "Your ShopVerse verification code";
        String body = wrapEmail(
                "Verify your email",
                "Use this code to finish creating your account.",
                """
                        <div style="font-size:32px;font-weight:800;letter-spacing:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 20px;text-align:center;margin:22px 0;">%s</div>
                        <p>This code expires in 10 minutes.</p>
                        <p style="color:#64748b;">If you did not request this, you can ignore this email.</p>
                        """.formatted(escape(code)));
        return asyncEmailSender.sendHtml(email, subject, body, "email verification for " + email);
    }

    public CompletableFuture<Boolean> sendAdminTwoFactorCode(User user, String code) {
        String subject = "Your ShopVerse admin sign-in code";
        String body = wrapEmail(
                "Admin sign-in code",
                "Hi " + escape(user.getFirstName()) + ",",
                """
                        <p>Use this code to finish signing in to the admin area.</p>
                        <div style="font-size:32px;font-weight:800;letter-spacing:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 20px;text-align:center;margin:22px 0;">%s</div>
                        <p>This code expires in 10 minutes.</p>
                        <p style="color:#64748b;">If this was not you, change your password immediately.</p>
                        """.formatted(escape(code)));
        return asyncEmailSender.sendHtml(user.getEmail(), subject, body, "admin 2FA for " + user.getEmail());
    }

    private String orderSummary(Order order) {
        return """
                <div style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin:20px 0;">
                  <div style="background:#0f172a;color:#ffffff;padding:14px 16px;">
                    <strong>Order #%d</strong>
                    <span style="float:right;">%s</span>
                  </div>
                  <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                    <thead>
                      <tr style="background:#f8fafc;">
                        <th align="left" style="padding:12px 16px;color:#64748b;font-size:13px;">Item</th>
                        <th align="center" style="padding:12px 16px;color:#64748b;font-size:13px;">Qty</th>
                        <th align="right" style="padding:12px 16px;color:#64748b;font-size:13px;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      %s
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="2" align="right" style="padding:14px 16px;border-top:1px solid #e2e8f0;font-weight:800;">Order total</td>
                        <td align="right" style="padding:14px 16px;border-top:1px solid #e2e8f0;font-weight:800;color:#ff5a1f;">%s</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                """.formatted(
                order.getId(),
                escape(formatDate(order)),
                orderItemRows(order),
                money(order.getTotalAmount()));
    }

    private String orderItemRows(Order order) {
        StringBuilder rows = new StringBuilder();
        for (OrderItem item : order.getItems()) {
            BigDecimal line = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            rows.append("""
                    <tr>
                      <td style="padding:13px 16px;border-top:1px solid #e2e8f0;font-weight:600;">%s</td>
                      <td align="center" style="padding:13px 16px;border-top:1px solid #e2e8f0;color:#64748b;">%d</td>
                      <td align="right" style="padding:13px 16px;border-top:1px solid #e2e8f0;font-weight:700;">%s</td>
                    </tr>
                    """.formatted(
                    escape(item.getProductName()),
                    item.getQuantity(),
                    money(line)));
        }
        return rows.toString();
    }

    private String shippingBlock(Order order) {
        return """
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin:20px 0;">
                  <div style="font-weight:800;margin-bottom:8px;">Shipping address</div>
                  <div>%s</div>
                  <div>%s, %s</div>
                  <div>%s</div>
                </div>
                """.formatted(
                escape(order.getShippingStreet()),
                escape(order.getShippingCity()),
                escape(order.getShippingZipCode()),
                escape(order.getShippingCountry()));
    }

    private String trackingBlock(Order order) {
        if (order.getTrackingNumber() == null || order.getTrackingNumber().isBlank()) {
            return "";
        }
        String url = trackingUrl(order.getShippingCarrier(), order.getTrackingNumber());
        String carrier = order.getShippingCarrier() == null || order.getShippingCarrier().isBlank()
                ? "Carrier"
                : order.getShippingCarrier();
        return """
                <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px;margin:20px 0;">
                  <div style="font-weight:800;margin-bottom:8px;">Tracking</div>
                  <div>%s: <strong>%s</strong></div>
                  <p style="margin:14px 0 0;">
                    <a href="%s" style="display:inline-block;background:#ff5a1f;color:#ffffff;text-decoration:none;font-weight:700;padding:10px 14px;border-radius:8px;">Track shipment</a>
                  </p>
                </div>
                """.formatted(escape(carrier), escape(order.getTrackingNumber()), escape(url));
    }

    private String wrapEmail(String title, String subtitle, String content) {
        AdminSettingsResponse settings = shopSettingsService.getSettings();
        String brandName = settings.brandName() == null || settings.brandName().isBlank()
                ? fromName
                : settings.brandName();
        String contactEmail = settings.contactEmail() == null || settings.contactEmail().isBlank()
                ? fromAddress
                : settings.contactEmail();
        String logo = settings.logoUrl() == null || settings.logoUrl().isBlank()
                ? """
                        <div style="width:44px;height:44px;border-radius:12px;background:#ff5a1f;color:#ffffff;display:inline-block;text-align:center;line-height:44px;font-size:20px;font-weight:900;margin-right:12px;vertical-align:middle;">%s</div>
                        """.formatted(escape(monogram(brandName)))
                : """
                        <img src="%s" alt="%s logo" width="48" height="48" style="width:48px;height:48px;object-fit:contain;border-radius:12px;margin-right:12px;vertical-align:middle;">
                        """.formatted(escape(settings.logoUrl()), escape(brandName));
        return """
                <!doctype html>
                <html>
                <body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b;">
                  <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
                    <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
                      <div style="background:#0f172a;color:#ffffff;padding:24px 28px;">
                        <div style="font-size:14px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#ffb199;">%s%s</div>
                        <h1 style="margin:10px 0 0;font-size:26px;line-height:1.25;">%s</h1>
                        <p style="margin:8px 0 0;color:#cbd5e1;font-size:15px;">%s</p>
                      </div>
                      <div style="padding:26px 28px;font-size:15px;line-height:1.65;">
                        %s
                      </div>
                    </div>
                    <p style="text-align:center;color:#64748b;font-size:12px;margin:16px 0 0;">%s customer emails are sent from %s.</p>
                  </div>
                </body>
                </html>
                """.formatted(logo, escape(brandName), escape(title), subtitle, content, escape(brandName), escape(contactEmail));
    }

    private String formatDate(Order order) {
        return order.getCreatedAt() != null
                ? DateTimeFormatter.ofPattern("MMM d, yyyy HH:mm")
                .withZone(ZoneId.systemDefault())
                .format(order.getCreatedAt())
                : "";
    }

    private String money(BigDecimal value) {
        return "$" + (value != null ? value.toPlainString() : "0.00");
    }

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private String monogram(String value) {
        if (value == null || value.isBlank()) return "S";
        String[] parts = value.trim().split("\\s+");
        if (parts.length == 1) {
            return parts[0].substring(0, 1).toUpperCase();
        }
        return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
    }

    private String trackingUrl(String carrier, String trackingNumber) {
        String encoded = trackingNumber.trim().replace(" ", "%20");
        String normalizedCarrier = carrier == null ? "" : carrier.trim().toLowerCase();
        if (normalizedCarrier.contains("ups")) {
            return "https://www.ups.com/track?tracknum=" + encoded;
        }
        if (normalizedCarrier.contains("fedex")) {
            return "https://www.fedex.com/fedextrack/?trknbr=" + encoded;
        }
        if (normalizedCarrier.contains("dhl")) {
            return "https://www.dhl.com/global-en/home/tracking.html?tracking-id=" + encoded;
        }
        if (normalizedCarrier.contains("usps")) {
            return "https://tools.usps.com/go/TrackConfirmAction?tLabels=" + encoded;
        }
        return "https://www.google.com/search?q=" + encoded + "%20tracking";
    }
}
