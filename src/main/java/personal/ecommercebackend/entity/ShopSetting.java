package personal.ecommercebackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;

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

    @ElementCollection
    @CollectionTable(name = "shop_state_tax_rates", joinColumns = @JoinColumn(name = "shop_setting_id"))
    @MapKeyColumn(name = "state_code", length = 100)
    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 4)
    @Builder.Default
    private Map<String, BigDecimal> stateTaxRates = new LinkedHashMap<>();

    @ElementCollection
    @CollectionTable(name = "shop_country_tax_rates", joinColumns = @JoinColumn(name = "shop_setting_id"))
    @MapKeyColumn(name = "country_code", length = 100)
    @Column(name = "tax_rate", nullable = false, precision = 5, scale = 4)
    @Builder.Default
    private Map<String, BigDecimal> countryTaxRates = new LinkedHashMap<>();

    @ElementCollection
    @CollectionTable(name = "shop_standard_shipping_state_rates", joinColumns = @JoinColumn(name = "shop_setting_id"))
    @MapKeyColumn(name = "state_code", length = 100)
    @Column(name = "shipping_cost", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private Map<String, BigDecimal> standardShippingStateCosts = new LinkedHashMap<>();

    @ElementCollection
    @CollectionTable(name = "shop_express_shipping_state_rates", joinColumns = @JoinColumn(name = "shop_setting_id"))
    @MapKeyColumn(name = "state_code", length = 100)
    @Column(name = "shipping_cost", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private Map<String, BigDecimal> expressShippingStateCosts = new LinkedHashMap<>();

    @ElementCollection
    @CollectionTable(name = "shop_standard_shipping_country_rates", joinColumns = @JoinColumn(name = "shop_setting_id"))
    @MapKeyColumn(name = "country_code", length = 100)
    @Column(name = "shipping_cost", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private Map<String, BigDecimal> standardShippingCountryCosts = new LinkedHashMap<>();

    @ElementCollection
    @CollectionTable(name = "shop_express_shipping_country_rates", joinColumns = @JoinColumn(name = "shop_setting_id"))
    @MapKeyColumn(name = "country_code", length = 100)
    @Column(name = "shipping_cost", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private Map<String, BigDecimal> expressShippingCountryCosts = new LinkedHashMap<>();
}
