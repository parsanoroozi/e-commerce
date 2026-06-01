package personal.ecommercebackend.dto.response;

import java.math.BigDecimal;

public record AdminSettingsResponse(
        int lowStockThreshold,
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
        BigDecimal expressShippingCost
) {
}
