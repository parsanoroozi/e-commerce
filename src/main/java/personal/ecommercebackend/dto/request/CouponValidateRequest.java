package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CouponValidateRequest(
        @NotBlank String code,
        @NotNull BigDecimal subtotal
) {}
