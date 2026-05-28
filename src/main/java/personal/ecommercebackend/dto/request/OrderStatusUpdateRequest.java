package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.NotNull;
import personal.ecommercebackend.entity.OrderStatus;

public record OrderStatusUpdateRequest(
        @NotNull OrderStatus status
) {}
