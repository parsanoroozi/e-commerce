package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;
import java.util.Map;

public record AdminSettingsResponse(
        String brandName,
        String logoUrl,
        String contactEmail,
        String contactPhone,
        String contactAddress,
        String homepageBannerTitle,
        String homepageBannerSubtitle,
        String homepageBannerImageUrl,
        String homepageBannerCtaText,
        String homepageBannerCtaUrl,
        BigDecimal taxRate,
        BigDecimal standardShippingCost,
        BigDecimal expressShippingCost,
        Map<String, BigDecimal> stateTaxRates,
        Map<String, BigDecimal> countryTaxRates,
        Map<String, BigDecimal> standardShippingStateCosts,
        Map<String, BigDecimal> expressShippingStateCosts,
        Map<String, BigDecimal> standardShippingCountryCosts,
        Map<String, BigDecimal> expressShippingCountryCosts
) {
}
