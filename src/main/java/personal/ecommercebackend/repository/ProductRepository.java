package personal.ecommercebackend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import personal.ecommercebackend.entity.Product;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
              AND (p.visibleFrom IS NULL OR p.visibleFrom <= :now)
              AND (p.visibleUntil IS NULL OR p.visibleUntil >= :now)
              AND (:categoryId IS NULL OR p.category.id = :categoryId)
              AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:minPrice IS NULL OR p.price >= :minPrice)
              AND (:maxPrice IS NULL OR p.price <= :maxPrice)
              AND (:inStock IS NULL OR :inStock = false OR p.stockQuantity > 0)
              AND (:minRating IS NULL OR (
                SELECT COALESCE(AVG(r.rating), 0)
                FROM ProductReview r
                WHERE r.product = p
              ) >= :minRating)
            """)
    Page<Product> searchVisible(
            @Param("categoryId") Long categoryId,
            @Param("search") String search,
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            @Param("inStock") Boolean inStock,
            @Param("minRating") Integer minRating,
            @Param("now") Instant now,
            Pageable pageable);

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

    @EntityGraph(attributePaths = {"category", "variants"})
    @Query("""
            SELECT DISTINCT p FROM Product p
            WHERE (:from IS NULL OR p.createdAt >= :from)
              AND (:to IS NULL OR p.createdAt <= :to)
              AND (:status IS NULL
                OR (:status = 'ACTIVE' AND p.active = true)
                OR (:status = 'INACTIVE' AND p.active = false)
                OR (:status = 'LOW_STOCK' AND p.stockQuantity <= 5))
            ORDER BY p.name ASC
            """)
    List<Product> findForReport(
            @Param("from") Instant from,
            @Param("to") Instant to,
            @Param("status") String status);

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
