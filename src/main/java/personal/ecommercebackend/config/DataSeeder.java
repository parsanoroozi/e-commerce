package personal.ecommercebackend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import personal.ecommercebackend.entity.*;
import personal.ecommercebackend.repository.CategoryRepository;
import personal.ecommercebackend.repository.CouponRepository;
import personal.ecommercebackend.repository.ProductRepository;
import personal.ecommercebackend.repository.ShopSettingRepository;
import personal.ecommercebackend.repository.UserRepository;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final ShopSettingRepository shopSettingRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.seed.admin-email:admin@shop.com}")
    private String adminEmail;

    @Value("${app.seed.admin-password:}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        log.info("Running database seed checks...");
        backfillVersionColumns();
        seedAdmin();
        seedShopSettings();
        if (categoryRepository.count() == 0) {
            seedCatalog();
        }
        seedCoupons();
    }

    private void backfillVersionColumns() {
        int productsUpdated = jdbcTemplate.update("UPDATE products SET version = 0 WHERE version IS NULL");
        int ordersUpdated = jdbcTemplate.update("UPDATE orders SET version = 0 WHERE version IS NULL");
        if (productsUpdated > 0 || ordersUpdated > 0) {
            log.info("Backfilled optimistic lock versions productsUpdated={} ordersUpdated={}", productsUpdated, ordersUpdated);
        }
    }

    private void seedShopSettings() {
        if (shopSettingRepository.existsById(ShopSetting.SINGLETON_ID)) {
            return;
        }
        shopSettingRepository.save(ShopSetting.builder()
                .id(ShopSetting.SINGLETON_ID)
                .lowStockThreshold(10)
                .build());
        log.info("Default shop settings seeded (low stock threshold: 10)");
    }

    private void seedCoupons() {
        if (couponRepository.count() > 0) {
            return;
        }
        couponRepository.save(Coupon.builder().code("SAVE10").discountPercent(new BigDecimal("10"))
                .minOrderAmount(new BigDecimal("50")).active(true).build());
        couponRepository.save(Coupon.builder().code("WELCOME5").discountAmount(new BigDecimal("5"))
                .minOrderAmount(new BigDecimal("25")).active(true).build());
    }

    private void seedAdmin() {
        String email = adminEmail.trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            return;
        }
        if (adminPassword == null || adminPassword.length() < 12) {
            throw new IllegalStateException("app.seed.admin-password must be at least 12 characters when seed data is enabled");
        }
        User admin = User.builder()
                .email(email)
                .password(passwordEncoder.encode(adminPassword))
                .firstName("Store")
                .lastName("Admin")
                .role(Role.ADMIN)
                .build();
        admin.setCart(Cart.builder().user(admin).build());
        userRepository.save(admin);
    }

    private void seedCatalog() {
        Category electronics = categoryRepository.save(Category.builder()
                .name("Electronics")
                .description("Gadgets and devices")
                .build());
        Category clothing = categoryRepository.save(Category.builder()
                .name("Clothing")
                .description("Apparel and accessories")
                .build());
        Category home = categoryRepository.save(Category.builder()
                .name("Home")
                .description("Home and kitchen essentials")
                .build());

        List<Product> products = List.of(
                product("Wireless Headphones", "Noise-cancelling over-ear headphones with 30h battery.",
                        "129.99", 50, electronics,
                        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"),
                product("Smart Watch", "Fitness tracking, heart rate monitor, and notifications.",
                        "199.99", 35, electronics,
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400"),
                product("Laptop Stand", "Ergonomic aluminum stand for better posture.",
                        "49.99", 80, electronics,
                        "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400"),
                product("Classic T-Shirt", "100% cotton crew neck tee in multiple colors.",
                        "24.99", 120, clothing,
                        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400"),
                product("Denim Jacket", "Medium-wash denim jacket with modern fit.",
                        "79.99", 40, clothing,
                        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400"),
                product("Running Shoes", "Lightweight running shoes with cushioned sole.",
                        "89.99", 60, clothing,
                        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"),
                product("Ceramic Mug Set", "Set of 4 handcrafted ceramic mugs.",
                        "34.99", 90, home,
                        "https://images.unsplash.com/photo-1514228742587-6b1558fcca13?w=400"),
                product("Desk Lamp", "LED desk lamp with adjustable brightness.",
                        "39.99", 55, home,
                        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400"),
                product("Throw Blanket", "Soft fleece throw blanket for cozy evenings.",
                        "29.99", 70, home,
                        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400")
        );
        productRepository.saveAll(products);
    }

    private Product product(String name, String description, String price,
                            int stock, Category category, String imageUrl) {
        return Product.builder()
                .name(name)
                .description(description)
                .price(new BigDecimal(price))
                .stockQuantity(stock)
                .category(category)
                .imageUrl(imageUrl)
                .active(true)
                .build();
    }
}
