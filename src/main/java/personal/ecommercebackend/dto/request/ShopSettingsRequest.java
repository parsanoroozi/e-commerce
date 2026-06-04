package personal.ecommercebackend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.Map;

public record ShopSettingsRequest(
        @Size(max = 120) String brandName,
        @Size(max = 500) String logoUrl,
        @Size(max = 160) String contactEmail,
        @Size(max = 40) String contactPhone,
        @Size(max = 500) String contactAddress,
        @Size(max = 160) String homepageBannerTitle,
        @Size(max = 500) String homepageBannerSubtitle,
        @Size(max = 500) String homepageBannerImageUrl,
        @Size(max = 120) String homepageBannerCtaText,
        @Size(max = 500) String homepageBannerCtaUrl,
        @DecimalMin("0.0000") BigDecimal taxRate,
        @DecimalMin("0.00") BigDecimal standardShippingCost,
        @DecimalMin("0.00") BigDecimal expressShippingCost,
        Map<String, BigDecimal> stateTaxRates,
        Map<String, BigDecimal> countryTaxRates,
        Map<String, BigDecimal> standardShippingStateCosts,
        Map<String, BigDecimal> expressShippingStateCosts,
        Map<String, BigDecimal> standardShippingCountryCosts,
        Map<String, BigDecimal> expressShippingCountryCosts
) {
}
