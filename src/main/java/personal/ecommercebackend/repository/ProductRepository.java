package personal.ecommercebackend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import personal.ecommercebackend.entity.Product;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
              AND (p.visibleFrom IS NULL OR p.visibleFrom <= :now)
              AND (p.visibleUntil IS NULL OR p.visibleUntil >= :now)
            """)
    Page<Product> findVisible(@Param("now") Instant now, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
              AND p.category.id = :categoryId
              AND (p.visibleFrom IS NULL OR p.visibleFrom <= :now)
              AND (p.visibleUntil IS NULL OR p.visibleUntil >= :now)
            """)
    Page<Product> findVisibleByCategory(@Param("categoryId") Long categoryId, @Param("now") Instant now, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
              AND (p.visibleFrom IS NULL OR p.visibleFrom <= :now)
              AND (p.visibleUntil IS NULL OR p.visibleUntil >= :now)
              AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Product> findVisibleBySearch(@Param("search") String search, @Param("now") Instant now, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
              AND p.category.id = :categoryId
              AND (p.visibleFrom IS NULL OR p.visibleFrom <= :now)
              AND (p.visibleUntil IS NULL OR p.visibleUntil >= :now)
              AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Product> findVisibleByCategoryAndSearch(
            @Param("categoryId") Long categoryId,
            @Param("search") String search,
            @Param("now") Instant now,
            Pageable pageable);

    Page<Product> findAllByOrderByNameAsc(Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
              AND p.category.id = :categoryId
              AND p.id <> :id
              AND (p.visibleFrom IS NULL OR p.visibleFrom <= :now)
              AND (p.visibleUntil IS NULL OR p.visibleUntil >= :now)
            """)
    Page<Product> findVisibleRelated(@Param("categoryId") Long categoryId, @Param("id") Long id, @Param("now") Instant now, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
              AND p.featured = true
              AND (p.visibleFrom IS NULL OR p.visibleFrom <= :now)
              AND (p.visibleUntil IS NULL OR p.visibleUntil >= :now)
            """)
    List<Product> findFeatured(@Param("now") Instant now, Pageable pageable);

    List<Product> findByActiveTrueAndStockQuantityLessThanEqualOrderByStockQuantityAsc(
            int stockQuantity, Pageable pageable);

    long countByActiveTrueAndStockQuantityLessThanEqual(int stockQuantity);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    Optional<Product> findBySlugIgnoreCase(String slug);

    boolean existsBySlugIgnoreCase(String slug);
}
