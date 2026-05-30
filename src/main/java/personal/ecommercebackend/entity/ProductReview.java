package personal.ecommercebackend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "product_reviews", indexes = {
        @Index(name = "idx_reviews_product_created", columnList = "product_id, created_at"),
        @Index(name = "idx_reviews_product_user", columnList = "product_id, user_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private int rating;

    @Column(length = 2000)
    private String comment;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
