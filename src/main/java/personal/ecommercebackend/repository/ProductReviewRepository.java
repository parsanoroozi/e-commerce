package personal.ecommercebackend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import personal.ecommercebackend.entity.ProductReview;

import java.util.Optional;
import java.util.Collection;
import java.util.List;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    Page<ProductReview> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);

    Optional<ProductReview> findByProductIdAndUserId(Long productId, Long userId);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM ProductReview r WHERE r.product.id = :productId")
    Double averageRatingByProductId(@Param("productId") Long productId);

    long countByProductId(Long productId);

    @Query("""
            SELECT r.product.id AS productId,
                   COALESCE(AVG(r.rating), 0) AS averageRating,
                   COUNT(r.id) AS reviewCount
            FROM ProductReview r
            WHERE r.product.id IN :productIds
            GROUP BY r.product.id
            """)
    List<ProductReviewSummary> summarizeByProductIds(@Param("productIds") Collection<Long> productIds);

    void deleteByUserId(Long userId);

    interface ProductReviewSummary {
        Long getProductId();

        Double getAverageRating();

        Long getReviewCount();
    }
}
