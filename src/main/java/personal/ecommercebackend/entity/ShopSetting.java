package personal.ecommercebackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

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

    @Column(nullable = false, length = 120)
    @Builder.Default
    private String brandName = "ShopVerse";

    @Column(length = 500)
    private String logoUrl;

    @Column(length = 160)
    @Builder.Default
    private String contactEmail = "support@shopverse.local";

    @Column(length = 40)
    private String contactPhone;

    @Column(length = 500)
    private String contactAddress;

    @Column(length = 160)
    @Builder.Default
    private String homepageBannerTitle = "Discover products you'll love";

    @Column(length = 500)
    @Builder.Default
    private String homepageBannerSubtitle = "Curated quality with fast checkout and secure payments.";

    @Column(length = 500)
    private String homepageBannerImageUrl;

    @Column(length = 120)
    @Builder.Default
    private String homepageBannerCtaText = "Shop featured";

    @Column(length = 500)
    @Builder.Default
    private String homepageBannerCtaUrl = "/";

    @Column(nullable = false, precision = 5, scale = 4)
    @Builder.Default
    private BigDecimal taxRate = BigDecimal.valueOf(0.08);

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal standardShippingCost = BigDecimal.valueOf(5.99);

    @Column(nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal expressShippingCost = BigDecimal.valueOf(14.99);
}
