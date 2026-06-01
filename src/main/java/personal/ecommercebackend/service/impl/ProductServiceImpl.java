package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.request.ProductRequest;
import personal.ecommercebackend.dto.request.ProductVariantRequest;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.dto.response.ProductResponse;
import personal.ecommercebackend.entity.Category;
import personal.ecommercebackend.entity.Product;
import personal.ecommercebackend.entity.ProductVariant;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.ProductRepository;
import personal.ecommercebackend.repository.ProductReviewRepository;
import personal.ecommercebackend.security.SecurityUtils;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

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
        return toProductPageResponse(page);
    }

    private ProductResponse toProductResponseWithReviews(Product product) {
        return EntityMapper.toProductResponse(product,
                productReviewRepository.averageRatingByProductId(product.getId()),
                productReviewRepository.countByProductId(product.getId()));
    }

    private PageResponse<ProductResponse> toProductPageResponse(Page<Product> page) {
        List<Product> products = page.getContent();
        if (products.isEmpty()) {
            return PageResponse.from(page.map(EntityMapper::toProductResponse));
        }
        Map<Long, ProductReviewRepository.ProductReviewSummary> summaries = productReviewRepository
                .summarizeByProductIds(products.stream().map(Product::getId).toList())
                .stream()
                .collect(Collectors.toMap(ProductReviewRepository.ProductReviewSummary::getProductId, Function.identity()));

        List<ProductResponse> responses = products.stream()
                .map(product -> {
                    ProductReviewRepository.ProductReviewSummary summary = summaries.get(product.getId());
                    return EntityMapper.toProductResponse(
                            product,
                            summary == null ? 0D : summary.getAverageRating(),
                            summary == null ? 0L : summary.getReviewCount());
                })
                .toList();

        return new PageResponse<>(
                responses,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast());
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

    @Override
    public Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private Product mapRequest(Product product, ProductRequest request, Category category) {
        product.setName(request.name().trim());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setSku(normalizeOptional(request.sku()));
        product.setStockQuantity(request.stockQuantity());
        product.setImageUrl(request.imageUrl());
        product.setCategory(category);
        if (request.active() != null) {
            product.setActive(request.active());
        }
        syncVariants(product, request.variants());
        syncAggregateStock(product);
        return product;
    }

    private void syncVariants(Product product, List<ProductVariantRequest> requests) {
        if (requests == null) {
            return;
        }
        product.getVariants().stream()
                .filter(existing -> requests.stream()
                        .map(ProductVariantRequest::id)
                        .filter(Objects::nonNull)
                        .noneMatch(id -> id.equals(existing.getId())))
                .forEach(existing -> existing.setActive(false));

        for (ProductVariantRequest request : requests) {
            ProductVariant variant = request.id() == null
                    ? null
                    : product.getVariants().stream()
                    .filter(existing -> request.id().equals(existing.getId()))
                    .findFirst()
                    .orElse(null);
            if (variant == null) {
                variant = ProductVariant.builder()
                        .product(product)
                        .stockQuantity(0)
                        .active(true)
                        .build();
                product.getVariants().add(variant);
            }
            variant.setProduct(product);
            variant.setSku(normalizeOptional(request.sku()));
            variant.setSize(normalizeOptional(request.size()));
            variant.setColor(normalizeOptional(request.color()));
            variant.setMaterial(normalizeOptional(request.material()));
            variant.setStockQuantity(request.stockQuantity() == null ? 0 : request.stockQuantity());
            variant.setActive(request.active() == null || request.active());
        }
    }

    private void syncAggregateStock(Product product) {
        if (product.getVariants() == null || product.getVariants().isEmpty()) {
            return;
        }
        int total = product.getVariants().stream()
                .filter(ProductVariant::isActive)
                .mapToInt(ProductVariant::getStockQuantity)
                .sum();
        product.setStockQuantity(total);
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @Override
    public ProductVariant getVariant(Long productId, Long variantId) {
        if (variantId == null) {
            return null;
        }
        Product product = getProduct(productId);
        return product.getVariants().stream()
                .filter(variant -> variant.getId().equals(variantId))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product variant not found"));
    }
}
