package personal.ecommercebackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import personal.ecommercebackend.entity.User;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Page<User> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
            SELECT u FROM User u
            WHERE u.role = personal.ecommercebackend.entity.Role.CUSTOMER
              AND (:from IS NULL OR u.createdAt >= :from)
              AND (:to IS NULL OR u.createdAt <= :to)
              AND (:status IS NULL
                OR (:status = 'ACTIVE' AND u.blocked = false)
                OR (:status = 'BLOCKED' AND u.blocked = true))
            ORDER BY u.createdAt DESC
            """)
    List<User> findCustomersForReport(
            @Param("from") Instant from,
            @Param("to") Instant to,
            @Param("status") String status);
}
