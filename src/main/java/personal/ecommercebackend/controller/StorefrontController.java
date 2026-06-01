package personal.ecommercebackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import personal.ecommercebackend.dto.response.AdminSettingsResponse;
import personal.ecommercebackend.service.ShopSettingsService;

@RestController
@RequestMapping("/api/storefront")
@RequiredArgsConstructor
public class StorefrontController {

    private final ShopSettingsService shopSettingsService;

    @GetMapping("/settings")
    public AdminSettingsResponse settings() {
        return shopSettingsService.getSettings();
    }
}
