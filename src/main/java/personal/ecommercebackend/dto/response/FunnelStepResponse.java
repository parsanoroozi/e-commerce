package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;

public record FunnelStepResponse(
        String label,
        long count,
        BigDecimal rate
) {}
