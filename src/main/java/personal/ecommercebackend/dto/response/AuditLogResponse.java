package personal.ecommercebackend.dto.response;

import java.time.Instant;

public record AuditLogResponse(
        Long id,
        String adminEmail,
        String action,
        String entityType,
        String entityId,
        String details,
        Instant createdAt
) {}
