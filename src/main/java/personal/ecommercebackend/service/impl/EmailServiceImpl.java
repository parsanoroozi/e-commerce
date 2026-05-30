package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import personal.ecommercebackend.entity.Order;
import personal.ecommercebackend.entity.OrderItem;
import personal.ecommercebackend.entity.User;

import java.math.BigDecimal;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:noreply@shopverse.local}")
    private String fromAddress;

    @Value("${app.mail.from-name:ShopVerse}")
    private String fromName;

    public void sendOrderConfirmation(Order order, User user) {
        String subject = "Order confirmed — ShopVerse #" + order.getId();
        String body = buildOrderConfirmationHtml(order, user);

        if (!mailEnabled) {
            log.info("Mail disabled — order confirmation for {} (order #{}):\n{}", user.getEmail(), order.getId(), body);
            return;
        }

        sendHtml(user.getEmail(), subject, body, "order confirmation #" + order.getId());
    }

    private String buildOrderConfirmationHtml(Order order, User user) {
        StringBuilder items = new StringBuilder();
        for (OrderItem item : order.getItems()) {
            BigDecimal line = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            items.append("<tr><td>")
                    .append(escape(item.getProductName()))
                    .append("</td><td>")
                    .append(item.getQuantity())
                    .append("</td><td>$")
                    .append(line)
                    .append("</td></tr>");
        }

        String date = order.getCreatedAt() != null
                ? DateTimeFormatter.ofPattern("MMM d, yyyy HH:mm")
                .withZone(ZoneId.systemDefault())
                .format(order.getCreatedAt())
                : "";

        return """
                <html><body style="font-family:Segoe UI,sans-serif;color:#1a2332;">
                <h2>Thank you for your order, %s!</h2>
                <p>Your payment was received. Order <strong>#%d</strong> is confirmed.</p>
                <p><strong>Placed:</strong> %s</p>
                <h3>Shipping to</h3>
                <p>%s<br>%s, %s %s<br>%s</p>
                <h3>Items</h3>
                <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;">
                <tr><th>Product</th><th>Qty</th><th>Total</th></tr>
                %s
                </table>
                <p style="margin-top:16px;"><strong>Order total: $%s</strong></p>
                <p style="color:#64748b;font-size:14px;">ShopVerse — happy shopping!</p>
                </body></html>
                """.formatted(
                escape(user.getFirstName()),
                order.getId(),
                date,
                escape(order.getShippingStreet()),
                escape(order.getShippingCity()),
                escape(order.getShippingZipCode()),
                escape(order.getShippingCountry()),
                items,
                order.getTotalAmount());
    }

    public void sendOrderShipped(Order order, User user) {
        String subject = "Your order has shipped — ShopVerse #" + order.getId();
        String body = "<p>Hi " + escape(user.getFirstName()) + ",</p>"
                + "<p>Great news! Order <strong>#" + order.getId() + "</strong> has been shipped.</p>"
                + "<p>Shipping to: " + escape(order.getShippingStreet()) + ", "
                + escape(order.getShippingCity()) + "</p>";

        sendHtml(user.getEmail(), subject, body, "shipped notification for order #" + order.getId());
    }

    public void sendPasswordReset(User user, String resetLink) {
        String subject = "Reset your ShopVerse password";
        String body = """
                <html><body style="font-family:Segoe UI,sans-serif;color:#1a2332;">
                <h2>Password reset</h2>
                <p>Hi %s,</p>
                <p>We received a request to reset your password. Click the link below (valid for 1 hour):</p>
                <p><a href="%s" style="color:#3d4de6;">Reset password</a></p>
                <p style="color:#64748b;font-size:14px;">If you did not request this, you can ignore this email.</p>
                </body></html>
                """.formatted(escape(user.getFirstName()), escape(resetLink));
        sendHtml(user.getEmail(), subject, body, "password reset for " + user.getEmail());
    }

    private void sendHtml(String to, String subject, String htmlBody, String logContext) {
        if (!mailEnabled) {
            log.info("Mail disabled — {}:\n{}", logContext, htmlBody);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {} ({})", to, logContext);
        } catch (Exception e) {
            log.error("Failed to send email to {} ({})", to, logContext, e);
            throw new RuntimeException("Failed to send email", e);
        }
    }

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
