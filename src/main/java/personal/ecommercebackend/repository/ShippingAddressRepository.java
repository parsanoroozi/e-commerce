package personal.ecommercebackend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import personal.ecommercebackend.entity.ShippingAddress;

import java.util.List;
import java.util.Optional;

public interface ShippingAddressRepository extends JpaRepository<ShippingAddress, Long> {

    List<ShippingAddress> findByUserIdOrderByIsDefaultDescLastUsedAtDescCreatedAtDesc(Long userId);

    Page<ShippingAddress> findByUserIdOrderByIsDefaultDescLastUsedAtDescCreatedAtDesc(Long userId, Pageable pageable);

    Optional<ShippingAddress> findByIdAndUserId(Long id, Long userId);

    Optional<ShippingAddress> findByUserIdAndStreetIgnoreCaseAndCityIgnoreCaseAndZipCodeAndCountryIgnoreCase(
            Long userId, String street, String city, String zipCode, String country);

    long countByUserId(Long userId);

    void deleteByUserId(Long userId);

    @Modifying
    @Query("UPDATE ShippingAddress a SET a.isDefault = false WHERE a.user.id = :userId")
    void clearDefaultForUser(@Param("userId") Long userId);
}
