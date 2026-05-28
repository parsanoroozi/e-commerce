package personal.ecommercebackend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import personal.ecommercebackend.entity.Order;

import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = {"items", "items.product", "user"})
    Page<Order> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @EntityGraph(attributePaths = {"items", "items.product"})
    Page<Order> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @EntityGraph(attributePaths = {"items", "items.product", "user"})
    Optional<Order> findWithDetailsById(Long id);

    @EntityGraph(attributePaths = {"items", "items.product", "user"})
    Optional<Order> findWithDetailsByStripePaymentIntentId(String stripePaymentIntentId);

    @EntityGraph(attributePaths = {"items", "items.product", "user"})
    Optional<Order> findWithDetailsByIdAndUserId(Long id, Long userId);
}
