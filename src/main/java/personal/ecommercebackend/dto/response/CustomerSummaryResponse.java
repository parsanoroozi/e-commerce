package personal.ecommercebackend.dto.response;

import personal.ecommercebackend.entity.Role;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record CustomerSummaryResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        String mobileNumber,
        Role role,
        boolean blocked,
        String customerSegment,
        List<String> computedSegments,
        long orderCount,
        BigDecimal lifetimeSpend,
        Instant createdAt
) {}
