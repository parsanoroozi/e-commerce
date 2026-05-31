package personal.ecommercebackend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import personal.ecommercebackend.entity.WishlistItem;

import java.util.List;
import java.util.Optional;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    @EntityGraph(attributePaths = {"product", "product.category"})
    List<WishlistItem> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"product", "product.category"})
    Page<WishlistItem> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Optional<WishlistItem> findByUserIdAndProductId(Long userId, Long productId);

    boolean existsByUserIdAndProductId(Long userId, Long productId);

    long countByUserId(Long userId);

    void deleteByUserIdAndProductId(Long userId, Long productId);

    void deleteByUserId(Long userId);
}
