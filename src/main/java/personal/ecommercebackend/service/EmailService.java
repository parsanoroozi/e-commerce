package personal.ecommercebackend.service;

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
public class EmailService {

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

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(user.getEmail());
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);
            log.info("Order confirmation email sent to {} for order #{}", user.getEmail(), order.getId());
        } catch (MessagingException e) {
            log.error("Failed to send order confirmation to {}", user.getEmail(), e);
            throw new RuntimeException("Failed to send confirmation email", e);
        } catch (java.io.UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }
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

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
