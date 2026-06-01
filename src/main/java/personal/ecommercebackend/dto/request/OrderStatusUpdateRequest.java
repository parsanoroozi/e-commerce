package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import personal.ecommercebackend.entity.OrderStatus;

public record OrderStatusUpdateRequest(
        @NotNull OrderStatus status,
        @Size(max = 100) String shippingCarrier,
        @Size(max = 120) String trackingNumber,
        @Size(max = 2000) String adminNotes,
        @Size(max = 1000) String timelineNote
) {}
