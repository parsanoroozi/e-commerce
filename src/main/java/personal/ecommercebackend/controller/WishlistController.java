package personal.ecommercebackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import personal.ecommercebackend.dto.response.ProductResponse;
import personal.ecommercebackend.service.WishlistService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public List<ProductResponse> list() {
        return wishlistService.listMine();
    }

    @GetMapping("/count")
    public Map<String, Long> count() {
        return Map.of("count", wishlistService.count());
    }

    @PostMapping("/{productId}")
    @ResponseStatus(HttpStatus.CREATED)
    public void add(@PathVariable Long productId) {
        wishlistService.add(productId);
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(@PathVariable Long productId) {
        wishlistService.remove(productId);
    }
}
