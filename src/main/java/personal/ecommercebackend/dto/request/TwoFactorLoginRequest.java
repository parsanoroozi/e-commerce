package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TwoFactorLoginRequest(
        @NotBlank String challengeId,
        @NotBlank @Size(min = 6, max = 6) String code
) {
}
