package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.request.CartItemRequest;
import personal.ecommercebackend.dto.response.CartResponse;
import personal.ecommercebackend.dto.response.CartSummaryResponse;
import personal.ecommercebackend.entity.Cart;
import personal.ecommercebackend.entity.CartItem;
import personal.ecommercebackend.entity.Product;
import personal.ecommercebackend.entity.ProductVariant;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.CartRepository;
import personal.ecommercebackend.repository.UserRepository;
import personal.ecommercebackend.security.SecurityUtils;

@Service
@RequiredArgsConstructor
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    @Transactional(readOnly = true)
    public CartResponse getCart() {
        return EntityMapper.toCartResponse(getOrCreateCart());
    }

    @Transactional(readOnly = true)
    public CartSummaryResponse getSummary() {
        Cart cart = getOrCreateCart();
        int count = cart.getItems().stream().mapToInt(CartItem::getQuantity).sum();
        return new CartSummaryResponse(count);
    }

    @Transactional
    public CartResponse addItem(CartItemRequest request) {
        Cart cart = getOrCreateCart();
        Product product = productService.getProduct(request.productId());
        ProductVariant variant = productService.getVariant(product.getId(), request.variantId());

        if (!product.isActive()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Product is not available");
        }
        if (variant == null && !product.getVariants().isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select a product variant");
        }
        validateStock(product, variant, request.quantity());
        if (variant != null && !variant.isActive()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Product variant is not available");
        }
        if (availableStock(product, variant) < request.quantity()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Insufficient stock");
        }

        CartItem existing = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(product.getId()))
                .filter(i -> sameVariant(i.getVariant(), variant))
                .findFirst()
                .orElse(null);

        if (existing != null) {
            int newQty = existing.getQuantity() + request.quantity();
            validateStock(product, variant, newQty);
            existing.setQuantity(newQty);
        } else {
            cart.getItems().add(CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .variant(variant)
                    .quantity(request.quantity())
                    .build());
        }

        return EntityMapper.toCartResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse updateItem(Long productId, CartItemRequest request) {
        Cart cart = getOrCreateCart();
        Product product = productService.getProduct(productId);

        CartItem item = cart.getItems().stream()
                .filter(i -> i.getProduct().getId().equals(productId))
                .filter(i -> request.variantId() == null || (i.getVariant() != null && i.getVariant().getId().equals(request.variantId())))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Item not in cart"));

        validateStock(product, item.getVariant(), request.quantity());
        item.setQuantity(request.quantity());
        return EntityMapper.toCartResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse removeItem(Long productId) {
        Cart cart = getOrCreateCart();
        cart.getItems().removeIf(i -> i.getProduct().getId().equals(productId));
        return EntityMapper.toCartResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse updateItemById(Long itemId, CartItemRequest request) {
        Cart cart = getOrCreateCart();
        CartItem item = cart.getItems().stream()
                .filter(i -> i.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Item not in cart"));
        validateStock(item.getProduct(), item.getVariant(), request.quantity());
        item.setQuantity(request.quantity());
        return EntityMapper.toCartResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse removeItemById(Long itemId) {
        Cart cart = getOrCreateCart();
        cart.getItems().removeIf(i -> i.getId().equals(itemId));
        return EntityMapper.toCartResponse(cartRepository.save(cart));
    }

    @Transactional
    public CartResponse clearCart() {
        Cart cart = getOrCreateCart();
        cart.getItems().clear();
        return EntityMapper.toCartResponse(cartRepository.save(cart));
    }

    private Cart getOrCreateCart() {
        Long userId = SecurityUtils.currentUserId();
        return cartRepository.findByUserId(userId).orElseGet(() -> {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
            Cart cart = Cart.builder().user(user).build();
            user.setCart(cart);
            return cartRepository.save(cart);
        });
    }

    private void validateStock(Product product, ProductVariant variant, int quantity) {
        if (availableStock(product, variant) < quantity) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Insufficient stock");
        }
    }

    private int availableStock(Product product, ProductVariant variant) {
        return variant == null ? product.getStockQuantity() : variant.getStockQuantity();
    }

    private boolean sameVariant(ProductVariant left, ProductVariant right) {
        if (left == null || right == null) {
            return left == right;
        }
        return left.getId().equals(right.getId());
    }
}
