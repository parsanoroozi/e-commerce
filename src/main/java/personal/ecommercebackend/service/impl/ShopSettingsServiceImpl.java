package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.request.UpdateLowStockThresholdRequest;
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
        return new AdminSettingsResponse(load().getLowStockThreshold());
    }

    @Override
    @Transactional
    public AdminSettingsResponse updateLowStockThreshold(UpdateLowStockThresholdRequest request) {
        ShopSetting settings = load();
        settings.setLowStockThreshold(request.lowStockThreshold());
        shopSettingRepository.save(settings);
        auditService.log("UPDATE_LOW_STOCK_THRESHOLD", "ShopSetting", "1",
                "Threshold set to " + request.lowStockThreshold());
        return new AdminSettingsResponse(settings.getLowStockThreshold());
    }

    private ShopSetting load() {
        return shopSettingRepository.findById(ShopSetting.SINGLETON_ID)
                .orElseGet(() -> shopSettingRepository.save(ShopSetting.builder()
                        .id(ShopSetting.SINGLETON_ID)
                        .lowStockThreshold(10)
                        .build()));
    }
}
