package personal.ecommercebackend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "shop_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopSetting {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id;

    @Column(nullable = false)
    @Builder.Default
    private int lowStockThreshold = 10;
}
