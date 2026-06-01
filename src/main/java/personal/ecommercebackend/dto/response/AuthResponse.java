package personal.ecommercebackend.dto.response;

public record AuthResponse(
        String token,
        UserResponse user,
        boolean requiresTwoFactor,
        String twoFactorChallengeId
) {}
