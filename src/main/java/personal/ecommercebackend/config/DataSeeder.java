package personal.ecommercebackend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import personal.ecommercebackend.entity.*;
import personal.ecommercebackend.repository.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true")
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final String DEMO_CUSTOMER_EMAIL = "mia.buyer@example.com";

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final ShopSettingRepository shopSettingRepository;
    private final ShippingAddressRepository shippingAddressRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ProductReviewRepository productReviewRepository;
    private final OrderRepository orderRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.seed.admin-email:admin@shop.com}")
    private String adminEmail;

    @Value("${app.seed.admin-password:}")
    private String adminPassword;

    @Value("${app.seed.demo-password:DemoPass123!}")
    private String demoPassword;

    @Value("${app.seed.demo-data-enabled:true}")
    private boolean demoDataEnabled;

    @Override
    public void run(String... args) {
        log.info("Running database seed checks...");
        backfillVersionColumns();
        seedAdmin();
        seedShopSettings();
        seedCoupons();
        if (demoDataEnabled && userRepository.findByEmail(DEMO_CUSTOMER_EMAIL).isEmpty()) {
            seedFullDemoData();
        } else if (!demoDataEnabled) {
            log.info("Full demo data seeding is disabled for this profile.");
        }
    }

    private void backfillVersionColumns() {
        int productsUpdated = jdbcTemplate.update("UPDATE products SET version = 0 WHERE version IS NULL");
        int ordersUpdated = jdbcTemplate.update("UPDATE orders SET version = 0 WHERE version IS NULL");
        if (productsUpdated > 0 || ordersUpdated > 0) {
            log.info("Backfilled optimistic lock versions productsUpdated={} ordersUpdated={}", productsUpdated, ordersUpdated);
        }
    }

    private void seedShopSettings() {
        ShopSetting settings = shopSettingRepository.findById(ShopSetting.SINGLETON_ID)
                .orElseGet(() -> ShopSetting.builder().id(ShopSetting.SINGLETON_ID).build());
        settings.setBrandName("ShopVerse Demo");
        settings.setLogoUrl("/luxury-assets/atelier-hero.png");
        settings.setContactEmail("support@shopverse.demo");
        settings.setContactPhone("+1 (555) 018-2040");
        settings.setContactAddress("120 Market Street, San Francisco, CA 94105");
        settings.setHomepageBannerTitle("A complete commerce demo");
        settings.setHomepageBannerSubtitle("Browse variants, gallery images, coupons, checkout recovery, tracking, invoices, refunds, and analytics.");
        settings.setHomepageBannerImageUrl("/luxury-assets/atelier-hero.png");
        settings.setHomepageBannerCtaText("Explore catalog");
        settings.setHomepageBannerCtaUrl("/");
        settings.setTaxRate(new BigDecimal("0.0825"));
        settings.setStandardShippingCost(new BigDecimal("6.95"));
        settings.setExpressShippingCost(new BigDecimal("16.95"));
        shopSettingRepository.save(settings);
    }

    private void seedCoupons() {
        coupon("SAVE10", "10", null, "50", 120, 2, false, 20);
        coupon("WELCOME5", null, "5", "25", 80, 1, false, 45);
        coupon("FREESHIP", null, null, "75", 40, 1, true, 10);
        coupon("VIP25", "25", null, "150", 10, 1, false, 3);
        coupon("EXPIRED15", "15", null, "50", 25, 1, false, -3);
    }

    private void coupon(String code, String percent, String amount, String min, Integer usageLimit,
                        Integer perUserLimit, boolean freeShipping, int expiresInDays) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code).orElseGet(Coupon::new);
        coupon.setCode(code);
        coupon.setDiscountPercent(percent == null ? null : new BigDecimal(percent));
        coupon.setDiscountAmount(amount == null ? null : new BigDecimal(amount));
        coupon.setMinOrderAmount(min == null ? null : new BigDecimal(min));
        coupon.setUsageLimit(usageLimit);
        coupon.setPerUserUsageLimit(perUserLimit);
        coupon.setFreeShipping(freeShipping);
        coupon.setExpiresAt(Instant.now().plus(expiresInDays, ChronoUnit.DAYS));
        coupon.setActive(expiresInDays > 0);
        couponRepository.save(coupon);
    }

    private void seedAdmin() {
        String email = adminEmail.trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            return;
        }
        String password = adminPassword == null || adminPassword.isBlank() ? demoPassword : adminPassword;
        if (password.length() < 12) {
            throw new IllegalStateException("Seed admin password must be at least 12 characters");
        }
        User admin = User.builder()
                .email(email)
                .password(passwordEncoder.encode(password))
                .firstName("Store")
                .lastName("Admin")
                .role(Role.ADMIN)
                .build();
        admin.setCart(Cart.builder().user(admin).build());
        userRepository.save(admin);
        log.info("Seed admin created email={} password={}", email, adminPassword == null || adminPassword.isBlank() ? demoPassword : "[configured]");
    }

    private void seedFullDemoData() {
        log.info("Seeding full demo data set...");
        DemoCatalog catalog = seedCatalog();
        User admin = userRepository.findByEmail(adminEmail.trim().toLowerCase()).orElse(null);
        User mia = customer("mia.buyer@example.com", "Mia", "Buyer", "VIP", "High-value repeat customer");
        User theo = customer("theo.runner@example.com", "Theo", "Runner", "at-risk", "Asked about express shipping");
        User nora = customer("nora.home@example.com", "Nora", "Home", "wholesale", "Interested in bulk home goods");
        User liam = customer("liam.tech@example.com", "Liam", "Tech", null, "Uses wishlist heavily");

        shippingAddress(mia, "Home", "44 Elm Street", "Austin", "TX", "78701", "United States", true);
        shippingAddress(mia, "Office", "500 Congress Ave", "Austin", "TX", "78701", "United States", false);
        shippingAddress(theo, "Apartment", "18 Lake Shore Dr", "Chicago", "IL", "60601", "United States", true);
        shippingAddress(nora, "Warehouse", "90 Harbor Road", "Seattle", "WA", "98101", "United States", true);
        shippingAddress(liam, "Home", "12 Mission Street", "San Francisco", "CA", "94105", "United States", true);

        wishlist(mia, catalog.watch, catalog.blanket, catalog.shoes);
        wishlist(theo, catalog.headphones, catalog.shoes);
        wishlist(liam, catalog.watch, catalog.lamp, catalog.stand);

        review(mia, catalog.headphones, 5, "Excellent sound and the gallery made it easy to choose.");
        review(theo, catalog.shoes, 4, "Comfortable for daily runs. Size variants were clear.");
        review(nora, catalog.mugs, 5, "Great packaging and fast fulfillment.");
        review(liam, catalog.watch, 4, "Good feature set for the price.");
        review(mia, catalog.blanket, 5, "Soft, accurate color, and quick delivery.");

        List<Order> orders = new ArrayList<>();
        orders.add(order(mia, OrderStatus.DELIVERED, ShippingMethod.EXPRESS, "SAVE10", "UPS", "1Z999AA10123456784", admin, 12,
                item(catalog.headphones, catalog.headphones.getVariants().get(0), 1),
                item(catalog.mugs, null, 2)));
        orders.add(order(mia, OrderStatus.REFUNDED, ShippingMethod.STANDARD, "WELCOME5", "USPS", "9400111206213111111111", admin, 9,
                item(catalog.jacket, catalog.jacket.getVariants().get(1), 1)));
        orders.add(order(theo, OrderStatus.SHIPPED, ShippingMethod.EXPRESS, "FREESHIP", "FedEx", "61299999999999999999", admin, 5,
                item(catalog.shoes, catalog.shoes.getVariants().get(0), 1),
                item(catalog.watch, null, 1)));
        orders.add(order(nora, OrderStatus.PACKED, ShippingMethod.STANDARD, null, null, null, admin, 3,
                item(catalog.blanket, catalog.blanket.getVariants().get(0), 3)));
        orders.add(order(liam, OrderStatus.CONFIRMED, ShippingMethod.STANDARD, "VIP25", null, null, admin, 1,
                item(catalog.watch, null, 1),
                item(catalog.stand, null, 1)));
        orders.add(order(theo, OrderStatus.CANCELLED, ShippingMethod.STANDARD, null, null, null, admin, 2,
                item(catalog.lamp, null, 1)));
        orders.add(order(nora, OrderStatus.AWAITING_PAYMENT, ShippingMethod.EXPRESS, "SAVE10", null, null, admin, 0,
                item(catalog.mugs, null, 4)));
        for (int i = 1; i <= 18; i++) {
            User user = List.of(mia, theo, nora, liam).get(i % 4);
            Product first = List.of(catalog.headphones, catalog.watch, catalog.shoes, catalog.blanket, catalog.mugs, catalog.lamp).get(i % 6);
            OrderStatus status = i % 5 == 0 ? OrderStatus.DELIVERED : i % 4 == 0 ? OrderStatus.SHIPPED : OrderStatus.CONFIRMED;
            orders.add(order(user, status, i % 3 == 0 ? ShippingMethod.EXPRESS : ShippingMethod.STANDARD,
                    i % 4 == 0 ? "SAVE10" : null, i % 4 == 0 ? "DHL" : null, i % 4 == 0 ? "JD014600006182000000" + i : null,
                    admin, 13 + i, item(first, first.getVariants().isEmpty() ? null : first.getVariants().get(0), 1 + (i % 2))));
        }
        seedNotifications(mia, theo, nora, liam, orders);
        log.info("Full demo data seeded customers={} products={} orders={}", 4, 9, orders.size());
    }

    private DemoCatalog seedCatalog() {
        Category digitalGoods = category("Digital Goods", "Technology products with device-specific specs", null, 20,
                "Color", "Weight", "Battery");
        Category electronics = category("Electronics", "Gadgets and devices", digitalGoods, 20,
                "Material");
        Category clothing = category("Clothing", "Apparel and accessories", null, 100,
                "Size", "Color", "Material");
        Category home = category("Home", "Home and kitchen essentials", null, 50,
                "Size", "Color", "Material");

        Product headphones = product("Wireless Headphones", "wireless-headphones", "Noise-cancelling over-ear headphones with 30h battery.", "129.99", 6, electronics, true, "#2563eb",
                variant("WH-BLK", 4, "Color", "Black", "Weight", "0.6 lb", "Battery", "30h", "Material", "Aluminum"),
                variant("WH-CRM", 2, "Color", "Cream", "Weight", "0.6 lb", "Battery", "30h", "Material", "Aluminum"));
        Product watch = product("Smart Watch", "smart-watch", "Fitness tracking, heart rate monitor, and notifications.", "199.99", 14, electronics, true, "#7c3aed");
        Product stand = product("Laptop Stand", "laptop-stand", "Ergonomic aluminum stand for better posture.", "49.99", 4, electronics, false, "#0891b2");
        Product shirt = product("Classic T-Shirt", "classic-t-shirt", "100% cotton crew neck tee in multiple colors.", "24.99", 62, clothing, false, "#16a34a",
                variant("TEE-S-BLK", 12, "Size", "S", "Color", "Black", "Material", "Cotton"),
                variant("TEE-M-BLK", 20, "Size", "M", "Color", "Black", "Material", "Cotton"),
                variant("TEE-L-WHT", 30, "Size", "L", "Color", "White", "Material", "Cotton"));
        Product jacket = product("Denim Jacket", "denim-jacket", "Medium-wash denim jacket with modern fit.", "79.99", 7, clothing, true, "#1d4ed8",
                variant("DJ-M", 3, "Size", "M", "Color", "Indigo", "Material", "Denim"),
                variant("DJ-L", 4, "Size", "L", "Color", "Indigo", "Material", "Denim"));
        Product shoes = product("Running Shoes", "running-shoes", "Lightweight running shoes with cushioned sole.", "89.99", 5, clothing, true, "#f97316",
                variant("RUN-9", 2, "Size", "9", "Color", "Orange", "Material", "Mesh"),
                variant("RUN-10", 3, "Size", "10", "Color", "Orange", "Material", "Mesh"));
        Product mugs = product("Ceramic Mug Set", "ceramic-mug-set", "Set of 4 handcrafted ceramic mugs.", "34.99", 22, home, false, "#be123c");
        Product lamp = product("Desk Lamp", "desk-lamp", "LED desk lamp with adjustable brightness.", "39.99", 3, home, false, "#ca8a04");
        Product blanket = product("Throw Blanket", "throw-blanket", "Soft fleece throw blanket for cozy evenings.", "29.99", 8, home, true, "#9333ea",
                variant("BLK-GRY", 5, "Size", "Queen", "Color", "Gray", "Material", "Fleece"),
                variant("BLK-SAG", 3, "Size", "Queen", "Color", "Sage", "Material", "Fleece"));
        return new DemoCatalog(headphones, watch, stand, shirt, jacket, shoes, mugs, lamp, blanket);
    }

    private Category category(String name, String description, Category parent, int lowStockThreshold, String... variantAttributes) {
        Category catalogCategory = categoryRepository.findAll().stream()
                .filter(existing -> existing.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(Category::new);
        catalogCategory.setName(name);
        catalogCategory.setDescription(description);
        catalogCategory.setParent(parent);
        catalogCategory.setLowStockThreshold(lowStockThreshold);
        catalogCategory.getVariantOptions().clear();
        for (int i = 0; i < variantAttributes.length; i++) {
            catalogCategory.getVariantOptions().add(CategoryVariantOption.builder()
                    .name(variantAttributes[i])
                    .displayOrder(i)
                    .build());
        }
        return categoryRepository.save(catalogCategory);
    }

    private Product product(String name, String slug, String description, String price, int stock, Category category,
                            boolean featured, String color, ProductVariant... variants) {
        Product product = productRepository.findBySlugIgnoreCase(slug).orElseGet(Product::new);
        product.setName(name);
        product.setSlug(slug);
        product.setDescription(description);
        product.setMetaTitle(name + " | ShopVerse Demo");
        product.setMetaDescription(description);
        product.setPrice(new BigDecimal(price));
        product.setSku("SKU-" + slug.toUpperCase().replace("-", "-"));
        product.setStockQuantity(stock);
        product.setCategory(category);
        product.setActive(true);
        product.setFeatured(featured);
        String main = productImagePath(slug);
        product.setImageUrl(main);
        product.getImages().clear();
        product.getImages().add(image(product, main, name + " main image", 0, true));
        product.getImages().add(image(product, main, name + " studio detail", 1, false));
        product.getImages().add(image(product, main, name + " editorial lifestyle", 2, false));
        product.getVariants().clear();
        for (ProductVariant variant : variants) {
            variant.setProduct(product);
            product.getVariants().add(variant);
        }
        return productRepository.save(product);
    }

    private ProductImage image(Product product, String url, String alt, int order, boolean primary) {
        return ProductImage.builder().product(product).url(url).altText(alt).sortOrder(order).primaryImage(primary).build();
    }

    private ProductVariant variant(String sku, int stock, String... attributePairs) {
        if (attributePairs.length % 2 != 0) {
            throw new IllegalArgumentException("Variant attributes must be key/value pairs");
        }
        Map<String, String> attributes = new LinkedHashMap<>();
        for (int i = 0; i < attributePairs.length; i += 2) {
            attributes.put(attributePairs[i], attributePairs[i + 1]);
        }
        return ProductVariant.builder()
                .sku(sku)
                .attributes(attributes)
                .stockQuantity(stock)
                .active(true)
                .build();
    }

    private User customer(String email, String firstName, String lastName, String segment, String notes) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            User user = User.builder()
                    .email(email)
                    .password(passwordEncoder.encode(demoPassword))
                    .firstName(firstName)
                    .lastName(lastName)
                    .mobileNumber("+1555010" + Math.abs(email.hashCode() % 9000))
                    .role(Role.CUSTOMER)
                    .customerSegment(segment)
                    .customerNotes(notes)
                    .build();
            user.setCart(Cart.builder().user(user).build());
            return userRepository.save(user);
        });
    }

    private void shippingAddress(User user, String label, String street, String city, String state, String zip,
                                 String country, boolean isDefault) {
        if (shippingAddressRepository.findByUserIdAndStreetIgnoreCaseAndCityIgnoreCaseAndZipCodeAndCountryIgnoreCase(
                user.getId(), street, city, zip, country).isPresent()) {
            return;
        }
        shippingAddressRepository.save(ShippingAddress.builder()
                .user(user).label(label).street(street).city(city).state(state).zipCode(zip).country(country)
                .latitude(37.7749).longitude(-122.4194).isDefault(isDefault).lastUsedAt(Instant.now().minus(1, ChronoUnit.DAYS))
                .build());
    }

    private void wishlist(User user, Product... products) {
        for (Product product : products) {
            wishlistItemRepository.save(WishlistItem.builder().user(user).product(product).build());
        }
    }

    private void review(User user, Product product, int rating, String comment) {
        productReviewRepository.findByProductIdAndUserId(product.getId(), user.getId())
                .orElseGet(() -> productReviewRepository.save(ProductReview.builder()
                        .user(user).product(product).rating(rating).comment(comment).build()));
    }

    private Order order(User user, OrderStatus status, ShippingMethod shippingMethod, String coupon, String carrier,
                        String tracking, User admin, int daysAgo, DemoItem... demoItems) {
        BigDecimal subtotal = BigDecimal.ZERO;
        Order order = Order.builder()
                .user(user)
                .status(status)
                .shippingMethod(shippingMethod)
                .shippingStreet("44 Elm Street")
                .shippingCity("Austin")
                .shippingState("TX")
                .shippingZipCode("78701")
                .shippingCountry("United States")
                .shippingLatitude(30.2672)
                .shippingLongitude(-97.7431)
                .shippingCarrier(carrier)
                .trackingNumber(tracking)
                .stripePaymentIntentId("pi_demo_" + user.getId() + "_" + daysAgo + "_" + System.nanoTime())
                .confirmationEmailSent(true)
                .shipmentEmailSent(status == OrderStatus.SHIPPED || status == OrderStatus.DELIVERED)
                .adminNotes("Seeded demo order showing " + status + " workflow.")
                .couponCode(coupon)
                .build();
        for (DemoItem demoItem : demoItems) {
            BigDecimal unit = demoItem.product().getPrice();
            subtotal = subtotal.add(unit.multiply(BigDecimal.valueOf(demoItem.quantity())));
            order.getItems().add(OrderItem.builder()
                    .order(order)
                    .product(demoItem.product())
                    .variant(demoItem.variant())
                    .productName(demoItem.product().getName())
                    .variantName(demoItem.variant() == null ? null : demoItem.variant().displayName())
                    .sku(demoItem.variant() == null ? demoItem.product().getSku() : demoItem.variant().getSku())
                    .quantity(demoItem.quantity())
                    .unitPrice(unit)
                    .build());
        }
        BigDecimal discount = coupon == null ? BigDecimal.ZERO : subtotal.multiply(new BigDecimal("0.10")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal shipping = shippingMethod == ShippingMethod.EXPRESS ? new BigDecimal("16.95") : new BigDecimal("6.95");
        if ("FREESHIP".equals(coupon)) shipping = BigDecimal.ZERO;
        BigDecimal tax = subtotal.subtract(discount).multiply(new BigDecimal("0.0825")).setScale(2, RoundingMode.HALF_UP);
        order.setSubtotalAmount(subtotal);
        order.setDiscountAmount(discount);
        order.setShippingCost(shipping);
        order.setTaxAmount(tax);
        order.setTotalAmount(subtotal.subtract(discount).add(shipping).add(tax));
        if (status == OrderStatus.PACKED || status == OrderStatus.SHIPPED || status == OrderStatus.DELIVERED) {
            order.setPackedAt(Instant.now().minus(Math.max(daysAgo - 1, 0), ChronoUnit.DAYS));
        }
        if (status == OrderStatus.SHIPPED || status == OrderStatus.DELIVERED) {
            order.setShippedAt(Instant.now().minus(Math.max(daysAgo - 2, 0), ChronoUnit.DAYS));
        }
        if (status == OrderStatus.DELIVERED) {
            order.setDeliveredAt(Instant.now().minus(Math.max(daysAgo - 4, 0), ChronoUnit.DAYS));
        }
        if (status == OrderStatus.REFUNDED) {
            BigDecimal refundAmount = order.getTotalAmount().min(new BigDecimal("35.00"));
            order.setRefundedAmount(refundAmount);
            order.getRefunds().add(OrderRefund.builder()
                    .order(order).adminUser(admin).amount(refundAmount).reason("Customer requested size exchange")
                    .status(RefundStatus.SUCCEEDED).providerRefundId("dev-refund-seed").providerMessage("Seeded successful refund")
                    .build());
        }
        order.getTimelineEvents().add(OrderTimelineEvent.builder()
                .order(order).adminUser(admin).action("FULFILLMENT_UPDATED").toStatus(status)
                .shippingCarrier(carrier).trackingNumber(tracking).note("Seeded workflow event for demo.")
                .build());
        Order saved = orderRepository.save(order);
        Instant created = Instant.now().minus(daysAgo, ChronoUnit.DAYS);
        jdbcTemplate.update("UPDATE orders SET created_at = ? WHERE id = ?", Timestamp.from(created), saved.getId());
        return saved;
    }

    private DemoItem item(Product product, ProductVariant variant, int quantity) {
        return new DemoItem(product, variant, quantity);
    }

    private void seedNotifications(User mia, User theo, User nora, User liam, List<Order> orders) {
        notification(mia, "Order delivered", "Your demo order was delivered.", orders.get(0).getId(), null, "/orders/" + orders.get(0).getId(), false);
        notification(mia, "Refund processed", "A partial refund was processed for one demo order.", orders.get(1).getId(), null, "/orders/" + orders.get(1).getId(), false);
        notification(theo, "Order shipped", "Your running gear is on the way.", orders.get(2).getId(), null, "/orders/" + orders.get(2).getId(), true);
        notification(nora, "Low stock reminder", "Throw Blanket is close to the low stock threshold.", null, orders.get(3).getItems().get(0).getProduct().getId(), "/admin/products", true);
        notification(liam, "Payment awaiting", "A checkout is waiting for payment confirmation.", orders.get(4).getId(), null, "/orders/" + orders.get(4).getId(), true);
    }

    private void notification(User user, String title, String message, Long orderId, Long productId, String target, boolean unread) {
        notificationRepository.save(Notification.builder()
                .user(user).title(title).message(message).relatedOrderId(orderId).relatedProductId(productId)
                .targetUrl(target).read(!unread).build());
    }

    private String productImagePath(String slug) {
        return "/luxury-assets/products/" + slug + ".png";
    }

    private record DemoCatalog(Product headphones, Product watch, Product stand, Product shirt, Product jacket,
                               Product shoes, Product mugs, Product lamp, Product blanket) {}
    private record DemoItem(Product product, ProductVariant variant, int quantity) {}
}
