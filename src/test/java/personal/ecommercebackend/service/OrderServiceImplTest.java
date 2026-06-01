package personal.ecommercebackend.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import personal.ecommercebackend.dto.request.CheckoutRequest;
import personal.ecommercebackend.dto.request.OrderStatusUpdateRequest;
import personal.ecommercebackend.dto.request.RefundRequest;
import personal.ecommercebackend.dto.response.CheckoutInitResponse;
import personal.ecommercebackend.entity.Cart;
import personal.ecommercebackend.entity.CartItem;
import personal.ecommercebackend.entity.Category;
import personal.ecommercebackend.entity.OrderStatus;
import personal.ecommercebackend.entity.Product;
import personal.ecommercebackend.entity.ProductVariant;
import personal.ecommercebackend.entity.Role;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.repository.CartRepository;
import personal.ecommercebackend.repository.CategoryRepository;
import personal.ecommercebackend.repository.NotificationRepository;
import personal.ecommercebackend.repository.OrderRepository;
import personal.ecommercebackend.repository.ProductRepository;
import personal.ecommercebackend.repository.ProductVariantRepository;
import personal.ecommercebackend.repository.ShippingAddressRepository;
import personal.ecommercebackend.repository.UserRepository;
import personal.ecommercebackend.security.UserPrincipal;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class OrderServiceImplTest {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private ProductVariantRepository productVariantRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ShippingAddressRepository shippingAddressRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User user;
    private Product product;

    @BeforeEach
    void setUp() {
        notificationRepository.deleteAll();
        orderRepository.deleteAll();
        cartRepository.deleteAll();
        shippingAddressRepository.deleteAll();
        productRepository.deleteAll();
        categoryRepository.deleteAll();
        userRepository.deleteAll();

        user = userRepository.save(User.builder()
                .email("customer@example.com")
                .password(passwordEncoder.encode("password123"))
                .firstName("Test")
                .lastName("Customer")
                .role(Role.CUSTOMER)
                .build());

        Category category = categoryRepository.save(Category.builder()
                .name("Concurrency Test")
                .description("Products used by checkout tests")
                .build());

        product = productRepository.save(Product.builder()
                .name("Limited Product")
                .description("Only a few in stock")
                .price(new BigDecimal("25.00"))
                .stockQuantity(3)
                .category(category)
                .active(true)
                .build());

        Cart cart = Cart.builder().user(user).build();
        cart.getItems().add(CartItem.builder()
                .cart(cart)
                .product(product)
                .quantity(2)
                .build());
        user.setCart(cart);
        cartRepository.save(cart);

        authenticate(user);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void confirmPaymentIsIdempotentAndDeductsStockOnce() {
        CheckoutInitResponse checkout = orderService.initiateCheckout(checkoutRequest());

        var first = orderService.confirmPayment(checkout.orderId());
        var second = orderService.confirmPayment(checkout.orderId());

        Product reloadedProduct = productRepository.findById(product.getId()).orElseThrow();
        Cart reloadedCart = cartRepository.findByUserId(user.getId()).orElseThrow();

        assertThat(first.status()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(second.status()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(reloadedProduct.getStockQuantity()).isEqualTo(1);
        assertThat(reloadedCart.getItems()).isEmpty();
        assertThat(notificationRepository.countByUserIdAndReadFalse(user.getId())).isEqualTo(1);
    }

    @Test
    void cancellingConfirmedOrderRestoresStock() {
        CheckoutInitResponse checkout = orderService.initiateCheckout(checkoutRequest());
        orderService.confirmPayment(checkout.orderId());

        var cancelled = orderService.cancelOrder(checkout.orderId());

        Product reloadedProduct = productRepository.findById(product.getId()).orElseThrow();

        assertThat(cancelled.status()).isEqualTo(OrderStatus.CANCELLED);
        assertThat(reloadedProduct.getStockQuantity()).isEqualTo(3);
    }

    @Test
    void variantCheckoutDeductsAndRestoresVariantStock() {
        ProductVariant variant = productVariantRepository.save(ProductVariant.builder()
                .product(product)
                .size("M")
                .color("Black")
                .sku("LIMITED-M-BLACK")
                .stockQuantity(2)
                .active(true)
                .build());
        product.setStockQuantity(2);
        productRepository.save(product);

        Cart cart = cartRepository.findByUserId(user.getId()).orElseThrow();
        cart.getItems().clear();
        cart.getItems().add(CartItem.builder()
                .cart(cart)
                .product(product)
                .variant(variant)
                .quantity(2)
                .build());
        cartRepository.save(cart);

        CheckoutInitResponse checkout = orderService.initiateCheckout(checkoutRequest());
        orderService.confirmPayment(checkout.orderId());

        Product afterFulfillment = productRepository.findById(product.getId()).orElseThrow();
        ProductVariant afterVariantFulfillment = productVariantRepository.findById(variant.getId()).orElseThrow();
        assertThat(afterVariantFulfillment.getStockQuantity()).isZero();
        assertThat(afterFulfillment.getStockQuantity()).isZero();

        orderService.cancelOrder(checkout.orderId());

        Product afterCancel = productRepository.findById(product.getId()).orElseThrow();
        ProductVariant afterVariantCancel = productVariantRepository.findById(variant.getId()).orElseThrow();
        assertThat(afterVariantCancel.getStockQuantity()).isEqualTo(2);
        assertThat(afterCancel.getStockQuantity()).isEqualTo(2);
    }

    @Test
    void adminCanPackShipAndTrackOrderWithInternalTimeline() {
        CheckoutInitResponse checkout = orderService.initiateCheckout(checkoutRequest());
        orderService.confirmPayment(checkout.orderId());

        User admin = userRepository.save(User.builder()
                .email("admin@example.com")
                .password(passwordEncoder.encode("password123"))
                .firstName("Admin")
                .lastName("User")
                .role(Role.ADMIN)
                .build());
        authenticate(admin);

        var packed = orderService.updateStatus(checkout.orderId(), new OrderStatusUpdateRequest(
                OrderStatus.PACKED,
                null,
                null,
                "Packed carefully.",
                "Items packed and ready for pickup."));

        var shipped = orderService.updateStatus(checkout.orderId(), new OrderStatusUpdateRequest(
                OrderStatus.SHIPPED,
                "UPS",
                "1Z999AA10123456784",
                "Packed carefully.",
                "Handed to carrier."));

        assertThat(packed.status()).isEqualTo(OrderStatus.PACKED);
        assertThat(packed.packedAt()).isNotNull();
        assertThat(packed.adminNotes()).isEqualTo("Packed carefully.");
        assertThat(shipped.status()).isEqualTo(OrderStatus.SHIPPED);
        assertThat(shipped.shippingCarrier()).isEqualTo("UPS");
        assertThat(shipped.trackingNumber()).isEqualTo("1Z999AA10123456784");
        assertThat(shipped.trackingUrl()).contains("ups.com");
        assertThat(shipped.shippedAt()).isNotNull();
        assertThat(shipped.staffTimeline())
                .extracting("action")
                .contains("PAYMENT_CONFIRMED", "FULFILLMENT_UPDATED");
    }

    @Test
    void adminCanPartiallyRefundOrderAndTrackRefundStatus() {
        CheckoutInitResponse checkout = orderService.initiateCheckout(checkoutRequest());
        orderService.confirmPayment(checkout.orderId());

        User admin = userRepository.save(User.builder()
                .email("refund-admin@example.com")
                .password(passwordEncoder.encode("password123"))
                .firstName("Refund")
                .lastName("Admin")
                .role(Role.ADMIN)
                .build());
        authenticate(admin);

        var refunded = orderService.refundOrder(checkout.orderId(), new RefundRequest(
                new BigDecimal("10.00"),
                "Customer requested partial refund"));

        assertThat(refunded.status()).isEqualTo(OrderStatus.CONFIRMED);
        assertThat(refunded.refundedAmount()).isEqualByComparingTo("10.00");
        assertThat(refunded.refundableAmount()).isEqualByComparingTo("50.47");
        assertThat(refunded.refunds()).hasSize(1);
        assertThat(refunded.refunds().get(0).status().name()).isEqualTo("SUCCEEDED");
        assertThat(refunded.refunds().get(0).reason()).isEqualTo("Customer requested partial refund");
    }

    private CheckoutRequest checkoutRequest() {
        return new CheckoutRequest(
                null,
                "Home",
                "123 Test Street",
                "Test City",
                "California",
                "12345",
                "USA",
                null,
                null,
                null,
                "STANDARD");
    }

    private void authenticate(User authenticatedUser) {
        UserPrincipal principal = new UserPrincipal(authenticatedUser);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        principal,
                        null,
                        principal.getAuthorities()));
    }
}
