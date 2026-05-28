package personal.ecommercebackend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import personal.ecommercebackend.entity.Product;

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
}
