package personal.ecommercebackend.dto.response;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String title,
        String message,
        boolean read,
        Long relatedOrderId,
        Long relatedProductId,
        String targetUrl,
        Instant createdAt
) {}
