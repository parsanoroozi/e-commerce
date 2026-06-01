package personal.ecommercebackend.entity;

public enum OrderStatus {
    AWAITING_PAYMENT,
    PENDING,
    CONFIRMED,
    PACKED,
    SHIPPED,
    DELIVERED,
    CANCELLED,
    REFUNDED
}
