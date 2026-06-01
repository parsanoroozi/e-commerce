package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.request.UpdateLowStockThresholdRequest;
import personal.ecommercebackend.dto.request.ShopSettingsRequest;
import personal.ecommercebackend.dto.response.AdminSettingsResponse;
import personal.ecommercebackend.entity.ShopSetting;
import personal.ecommercebackend.repository.ShopSettingRepository;

@Service
@RequiredArgsConstructor
public class ShopSettingsServiceImpl implements ShopSettingsService {

    private final ShopSettingRepository shopSettingRepository;
    private final AuditService auditService;

    @Override
    @Transactional(readOnly = true)
    public int getLowStockThreshold() {
        return load().getLowStockThreshold();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminSettingsResponse getSettings() {
        return toResponse(load());
    }

    @Override
    @Transactional
    public AdminSettingsResponse updateLowStockThreshold(UpdateLowStockThresholdRequest request) {
        ShopSetting settings = load();
        settings.setLowStockThreshold(request.lowStockThreshold());
        shopSettingRepository.save(settings);
        auditService.log("UPDATE_LOW_STOCK_THRESHOLD", "ShopSetting", "1",
                "Threshold set to " + request.lowStockThreshold());
        return toResponse(settings);
    }

    @Override
    @Transactional
    public AdminSettingsResponse updateSettings(ShopSettingsRequest request) {
        ShopSetting settings = load();
        if (request.lowStockThreshold() != null) {
            settings.setLowStockThreshold(request.lowStockThreshold());
        }
        settings.setBrandName(defaultIfBlank(request.brandName(), settings.getBrandName()));
        settings.setLogoUrl(normalizeOptional(request.logoUrl()));
        settings.setContactEmail(normalizeOptional(request.contactEmail()));
        settings.setContactPhone(normalizeOptional(request.contactPhone()));
        settings.setContactAddress(normalizeOptional(request.contactAddress()));
        settings.setHomepageBannerTitle(defaultIfBlank(request.homepageBannerTitle(), settings.getHomepageBannerTitle()));
        settings.setHomepageBannerSubtitle(normalizeOptional(request.homepageBannerSubtitle()));
        settings.setHomepageBannerImageUrl(normalizeOptional(request.homepageBannerImageUrl()));
        settings.setHomepageBannerCtaText(defaultIfBlank(request.homepageBannerCtaText(), settings.getHomepageBannerCtaText()));
        settings.setHomepageBannerCtaUrl(defaultIfBlank(request.homepageBannerCtaUrl(), settings.getHomepageBannerCtaUrl()));
        if (request.taxRate() != null) {
            settings.setTaxRate(request.taxRate());
        }
        if (request.standardShippingCost() != null) {
            settings.setStandardShippingCost(request.standardShippingCost());
        }
        if (request.expressShippingCost() != null) {
            settings.setExpressShippingCost(request.expressShippingCost());
        }
        shopSettingRepository.save(settings);
        auditService.log("UPDATE", "ShopSetting", "1", "Storefront settings updated");
        return toResponse(settings);
    }

    private ShopSetting load() {
        return shopSettingRepository.findById(ShopSetting.SINGLETON_ID)
                .orElseGet(() -> shopSettingRepository.save(ShopSetting.builder()
                        .id(ShopSetting.SINGLETON_ID)
                        .lowStockThreshold(10)
                        .build()));
    }

    private AdminSettingsResponse toResponse(ShopSetting settings) {
        return new AdminSettingsResponse(
                settings.getLowStockThreshold(),
                settings.getBrandName(),
                settings.getLogoUrl(),
                settings.getContactEmail(),
                settings.getContactPhone(),
                settings.getContactAddress(),
                settings.getHomepageBannerTitle(),
                settings.getHomepageBannerSubtitle(),
                settings.getHomepageBannerImageUrl(),
                settings.getHomepageBannerCtaText(),
                settings.getHomepageBannerCtaUrl(),
                settings.getTaxRate(),
                settings.getStandardShippingCost(),
                settings.getExpressShippingCost());
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String defaultIfBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
