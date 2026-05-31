package personal.ecommercebackend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import personal.ecommercebackend.entity.ProductReview;

import java.util.Optional;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    Page<ProductReview> findByProductIdOrderByCreatedAtDesc(Long productId, Pageable pageable);

    Optional<ProductReview> findByProductIdAndUserId(Long productId, Long userId);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM ProductReview r WHERE r.product.id = :productId")
    Double averageRatingByProductId(@Param("productId") Long productId);

    long countByProductId(Long productId);

    void deleteByUserId(Long userId);
}
