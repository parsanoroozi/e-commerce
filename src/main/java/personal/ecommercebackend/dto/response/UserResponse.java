package personal.ecommercebackend.dto.response;

import personal.ecommercebackend.entity.Role;

public record UserResponse(
        Long id,
        String email,
        String firstName,
        String lastName,
        Role role
) {}
