package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.Size;
import personal.ecommercebackend.entity.Role;

public record CustomerManagementRequest(
        Boolean blocked,
        @Size(max = 2000) String customerNotes,
        @Size(max = 80) String customerSegment,
        Role role
) {}
