package personal.ecommercebackend.dto.response;

import java.time.Instant;

public record SessionResponse(
        Long id,
        String userAgent,
        String ipAddress,
        Instant createdAt,
        Instant lastSeenAt,
        Instant expiresAt,
        boolean current,
        boolean revoked
) {
}
