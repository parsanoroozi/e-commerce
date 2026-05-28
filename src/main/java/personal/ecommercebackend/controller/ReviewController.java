package personal.ecommercebackend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import personal.ecommercebackend.dto.request.ReviewRequest;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.dto.response.ReviewResponse;
import personal.ecommercebackend.service.ReviewService;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public PageResponse<ReviewResponse> list(
            @PathVariable Long productId,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return reviewService.listForProduct(productId, pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse create(@PathVariable Long productId, @Valid @RequestBody ReviewRequest request) {
        return reviewService.create(productId, request);
    }
}
