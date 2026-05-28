package personal.ecommercebackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.request.ProductRequest;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.dto.response.ProductResponse;
import personal.ecommercebackend.entity.Category;
import personal.ecommercebackend.entity.Product;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.ProductRepository;
import personal.ecommercebackend.repository.ProductReviewRepository;
import personal.ecommercebackend.security.SecurityUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryService categoryService;
    private final ProductReviewRepository productReviewRepository;

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> findAllForAdmin(Pageable pageable) {
        return PageResponse.from(
                productRepository.findAllByOrderByNameAsc(pageable).map(EntityMapper::toProductResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> search(Long categoryId, String search, Pageable pageable) {
        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();
        Page<Product> page = resolveSearchPage(categoryId, normalizedSearch, pageable);
        return PageResponse.from(page.map(this::toProductResponseWithReviews));
    }

    private ProductResponse toProductResponseWithReviews(Product product) {
        return EntityMapper.toProductResponse(product,
                productReviewRepository.averageRatingByProductId(product.getId()),
                productReviewRepository.countByProductId(product.getId()));
    }

    private Page<Product> resolveSearchPage(Long categoryId, String search, Pageable pageable) {
        if (search == null && categoryId == null) {
            return productRepository.findByActiveTrue(pageable);
        }
        if (search == null) {
            return productRepository.findByActiveTrueAndCategoryId(categoryId, pageable);
        }
        if (categoryId == null) {
            return productRepository.findActiveBySearch(search, pageable);
        }
        return productRepository.findActiveByCategoryAndSearch(categoryId, search, pageable);
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(Long id) {
        Product product = getProduct(id);
        if (!product.isActive() && !SecurityUtils.isAdmin()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Product not found");
        }
        return toProductResponseWithReviews(product);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> findRelated(Long id, Pageable pageable) {
        Product product = getProduct(id);
        return productRepository
                .findByActiveTrueAndCategoryIdAndIdNot(product.getCategory().getId(), id, pageable)
                .map(this::toProductResponseWithReviews)
                .getContent();
    }

    @Transactional
    public ProductResponse create(ProductRequest request) {
        Category category = categoryService.getCategory(request.categoryId());
        Product product = mapRequest(new Product(), request, category);
        return EntityMapper.toProductResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse update(Long id, ProductRequest request) {
        Product product = getProduct(id);
        Category category = categoryService.getCategory(request.categoryId());
        mapRequest(product, request, category);
        return EntityMapper.toProductResponse(productRepository.save(product));
    }

    @Transactional
    public void delete(Long id) {
        Product product = getProduct(id);
        product.setActive(false);
        productRepository.save(product);
    }

    Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private Product mapRequest(Product product, ProductRequest request, Category category) {
        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setStockQuantity(request.stockQuantity());
        product.setImageUrl(request.imageUrl());
        product.setCategory(category);
        if (request.active() != null) {
            product.setActive(request.active());
        }
        return product;
    }
}
