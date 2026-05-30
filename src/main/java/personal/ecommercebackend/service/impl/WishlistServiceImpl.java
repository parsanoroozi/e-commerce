package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.response.ProductResponse;
import personal.ecommercebackend.entity.Product;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.entity.WishlistItem;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.UserRepository;
import personal.ecommercebackend.repository.WishlistItemRepository;
import personal.ecommercebackend.security.SecurityUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistServiceImpl implements WishlistService {

    private final WishlistItemRepository wishlistItemRepository;
    private final UserRepository userRepository;
    private final ProductService productService;

    @Transactional(readOnly = true)
    public List<ProductResponse> listMine() {
        return wishlistItemRepository.findByUserIdOrderByCreatedAtDesc(SecurityUtils.currentUserId())
                .stream()
                .map(w -> EntityMapper.toProductResponse(w.getProduct()))
                .toList();
    }

    @Transactional(readOnly = true)
    public long count() {
        return wishlistItemRepository.countByUserId(SecurityUtils.currentUserId());
    }

    @Transactional
    public void add(Long productId) {
        Long userId = SecurityUtils.currentUserId();
        if (wishlistItemRepository.existsByUserIdAndProductId(userId, productId)) {
            return;
        }
        Product product = productService.getProduct(productId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        wishlistItemRepository.save(WishlistItem.builder().user(user).product(product).build());
    }

    @Transactional
    public void remove(Long productId) {
        wishlistItemRepository.deleteByUserIdAndProductId(SecurityUtils.currentUserId(), productId);
    }
}
