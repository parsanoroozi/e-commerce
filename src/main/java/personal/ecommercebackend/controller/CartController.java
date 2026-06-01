package personal.ecommercebackend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import personal.ecommercebackend.dto.request.CartItemRequest;
import personal.ecommercebackend.dto.response.CartResponse;
import personal.ecommercebackend.dto.response.CartSummaryResponse;
import personal.ecommercebackend.service.CartService;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public CartResponse getCart() {
        return cartService.getCart();
    }

    @GetMapping("/summary")
    public CartSummaryResponse getSummary() {
        return cartService.getSummary();
    }

    @PostMapping("/items")
    public CartResponse addItem(@Valid @RequestBody CartItemRequest request) {
        return cartService.addItem(request);
    }

    @PutMapping("/items/{productId}")
    public CartResponse updateItem(
            @PathVariable Long productId,
            @Valid @RequestBody CartItemRequest request) {
        return cartService.updateItem(productId, request);
    }

    @DeleteMapping("/items/{productId}")
    public CartResponse removeItem(@PathVariable Long productId) {
        return cartService.removeItem(productId);
    }

    @PutMapping("/line-items/{itemId}")
    public CartResponse updateLineItem(
            @PathVariable Long itemId,
            @Valid @RequestBody CartItemRequest request) {
        return cartService.updateItemById(itemId, request);
    }

    @DeleteMapping("/line-items/{itemId}")
    public CartResponse removeLineItem(@PathVariable Long itemId) {
        return cartService.removeItemById(itemId);
    }

    @DeleteMapping
    public CartResponse clearCart() {
        return cartService.clearCart();
    }
}
