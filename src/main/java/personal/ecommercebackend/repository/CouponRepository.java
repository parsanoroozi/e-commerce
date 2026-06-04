package personal.ecommercebackend.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import personal.ecommercebackend.entity.Coupon;

import java.util.List;
import java.util.Optional;

public interface CouponRepository extends JpaRepository<Coupon, Long> {

    @Override
    @EntityGraph(attributePaths = {"productIds", "categoryIds"})
    List<Coupon> findAll();

    Optional<Coupon> findByCodeIgnoreCase(String code);
}
