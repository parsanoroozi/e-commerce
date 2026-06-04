package personal.ecommercebackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Entity
@Table(name = "product_variants", indexes = {
        @Index(name = "idx_product_variants_product", columnList = "product_id"),
        @Index(name = "idx_product_variants_sku", columnList = "sku"),
        @Index(name = "idx_product_variants_active_stock", columnList = "active, stock_quantity")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Long version = 0L;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(length = 100)
    private String sku;

    @Column(length = 100)
    private String size;

    @Column(length = 100)
    private String color;

    @Column(length = 100)
    private String material;

    @ElementCollection
    @CollectionTable(name = "product_variant_attributes", joinColumns = @JoinColumn(name = "variant_id"))
    @MapKeyColumn(name = "attribute_name", length = 80)
    @Column(name = "attribute_value", nullable = false, length = 255)
    @Builder.Default
    private Map<String, String> attributes = new LinkedHashMap<>();

    @Column(nullable = false)
    private Integer stockQuantity;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    public String displayName() {
        if (attributes != null && !attributes.isEmpty()) {
            String joined = String.join(" / ", attributes.values().stream()
                    .filter(value -> value != null && !value.isBlank())
                    .map(String::trim)
                    .toList());
            if (!joined.isBlank()) {
                return joined;
            }
        }
        StringBuilder builder = new StringBuilder();
        append(builder, size);
        append(builder, color);
        append(builder, material);
        return builder.isEmpty() ? null : builder.toString();
    }

    private void append(StringBuilder builder, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (!builder.isEmpty()) {
            builder.append(" / ");
        }
        builder.append(value.trim());
    }
}
