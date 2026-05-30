package personal.ecommercebackend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import personal.ecommercebackend.entity.Product;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

public interface ProductRepository extends JpaRepository<Product, Long> {

    Page<Product> findByActiveTrue(Pageable pageable);

    Page<Product> findByActiveTrueAndCategoryId(Long categoryId, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
              AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Product> findActiveBySearch(@Param("search") String search, Pageable pageable);

    @Query("""
            SELECT p FROM Product p
            WHERE p.active = true
              AND p.category.id = :categoryId
              AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(p.description) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Product> findActiveByCategoryAndSearch(
            @Param("categoryId") Long categoryId,
            @Param("search") String search,
            Pageable pageable);

    Page<Product> findAllByOrderByNameAsc(Pageable pageable);

    Page<Product> findByActiveTrueAndCategoryIdAndIdNot(Long categoryId, Long id, Pageable pageable);

    List<Product> findByActiveTrueAndStockQuantityLessThanEqualOrderByStockQuantityAsc(
            int stockQuantity, Pageable pageable);

    long countByActiveTrueAndStockQuantityLessThanEqual(int stockQuantity);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Product p WHERE p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);
}
