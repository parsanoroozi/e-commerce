package personal.ecommercebackend.entity;

import java.math.BigDecimal;

public enum ShippingMethod {
    STANDARD(new BigDecimal("5.99"), "Standard (5-7 days)"),
    EXPRESS(new BigDecimal("14.99"), "Express (1-2 days)");

    private final BigDecimal price;
    private final String label;

    ShippingMethod(BigDecimal price, String label) {
        this.price = price;
        this.label = label;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public String getLabel() {
        return label;
    }
}
