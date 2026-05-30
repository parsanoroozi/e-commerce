package personal.ecommercebackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import personal.ecommercebackend.entity.ShopSetting;

public interface ShopSettingRepository extends JpaRepository<ShopSetting, Long> {
}
