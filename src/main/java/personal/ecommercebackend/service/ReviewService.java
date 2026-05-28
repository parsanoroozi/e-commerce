package personal.ecommercebackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.request.ReviewRequest;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.dto.response.ReviewResponse;
import personal.ecommercebackend.entity.Product;
import personal.ecommercebackend.entity.ProductReview;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.ProductReviewRepository;
import personal.ecommercebackend.repository.UserRepository;
import personal.ecommercebackend.security.SecurityUtils;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductService productService;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponse<ReviewResponse> listForProduct(Long productId, Pageable pageable) {
        productService.getProduct(productId);
        Page<ReviewResponse> page = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable)
                .map(EntityMapper::toReviewResponse);
        return PageResponse.from(page);
    }

    @Transactional
    public ReviewResponse create(Long productId, ReviewRequest request) {
        Product product = productService.getProduct(productId);
        Long userId = SecurityUtils.currentUserId();
        if (reviewRepository.findByProductIdAndUserId(productId, userId).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "You already reviewed this product");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        ProductReview review = ProductReview.builder()
                .product(product)
                .user(user)
                .rating(request.rating())
                .comment(request.comment())
                .build();
        return EntityMapper.toReviewResponse(reviewRepository.save(review));
    }

    public Double averageRating(Long productId) {
        return reviewRepository.averageRatingByProductId(productId);
    }

    public long reviewCount(Long productId) {
        return reviewRepository.countByProductId(productId);
    }
}
