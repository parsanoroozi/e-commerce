package personal.ecommercebackend.dto.response;

import java.time.Instant;

public record ReviewResponse(
        Long id,
        Long productId,
        String userName,
        int rating,
        String comment,
        Instant createdAt
) {}
