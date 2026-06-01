package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.request.ProductRequest;
import personal.ecommercebackend.dto.request.ProductImageOrderRequest;
import personal.ecommercebackend.dto.request.ProductImageRequest;
import personal.ecommercebackend.dto.request.ProductImageUpdateRequest;
import personal.ecommercebackend.dto.request.ProductVariantRequest;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.dto.response.ProductResponse;
import personal.ecommercebackend.entity.Category;
import personal.ecommercebackend.entity.Product;
import personal.ecommercebackend.entity.ProductImage;
import personal.ecommercebackend.entity.ProductVariant;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.ProductRepository;
import personal.ecommercebackend.repository.ProductImageRepository;
import personal.ecommercebackend.repository.ProductReviewRepository;
import personal.ecommercebackend.security.SecurityUtils;
import personal.ecommercebackend.storage.FileStorageService;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.math.BigDecimal;
import java.time.Instant;
import java.text.Normalizer;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryService categoryService;
    private final ProductReviewRepository productReviewRepository;
    private final ProductImageRepository productImageRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> findAllForAdmin(Pageable pageable) {
        return PageResponse.from(
                productRepository.findAllByOrderByNameAsc(pageable).map(EntityMapper::toProductResponse));
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> search(Long categoryId, String search, Pageable pageable) {
        return search(categoryId, search, null, null, null, null, pageable);
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> search(Long categoryId, String search, BigDecimal minPrice, BigDecimal maxPrice,
                                                Boolean inStock, Integer minRating, Pageable pageable) {
        String normalizedSearch = (search == null || search.isBlank()) ? null : search.trim();
        Page<Product> page = productRepository.searchVisible(
                categoryId,
                normalizedSearch,
                minPrice,
                maxPrice,
                inStock,
                minRating,
                Instant.now(),
                pageable);
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
            return productRepository.findVisible(Instant.now(), pageable);
        }
        if (search == null) {
            return productRepository.findVisibleByCategory(categoryId, Instant.now(), pageable);
        }
        if (categoryId == null) {
            return productRepository.findVisibleBySearch(search, Instant.now(), pageable);
        }
        return productRepository.findVisibleByCategoryAndSearch(categoryId, search, Instant.now(), pageable);
    }

    @Transactional(readOnly = true)
    public ProductResponse findById(Long id) {
        Product product = getProduct(id);
        if ((!product.isActive() || !isVisibleNow(product)) && !SecurityUtils.isAdmin()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Product not found");
        }
        return toProductResponseWithReviews(product);
    }

    @Transactional(readOnly = true)
    public ProductResponse findBySlug(String slug) {
        Product product = productRepository.findBySlugIgnoreCase(slug)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
        if ((!product.isActive() || !isVisibleNow(product)) && !SecurityUtils.isAdmin()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Product not found");
        }
        return toProductResponseWithReviews(product);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> findRelated(Long id, Pageable pageable) {
        Product product = getProduct(id);
        return productRepository
                .findVisibleRelated(product.getCategory().getId(), id, Instant.now(), pageable)
                .map(this::toProductResponseWithReviews)
                .getContent();
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> featured(Pageable pageable) {
        return productRepository.findFeatured(Instant.now(), pageable).stream()
                .map(this::toProductResponseWithReviews)
                .toList();
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

    @Transactional
    public ProductResponse addImage(Long productId, ProductImageRequest request) {
        Product product = getProduct(productId);
        ProductImage image = ProductImage.builder()
                .product(product)
                .url(request.url().trim())
                .altText(normalizeOptional(request.altText()))
                .sortOrder(request.sortOrder() == null ? product.getImages().size() : request.sortOrder())
                .primaryImage(Boolean.TRUE.equals(request.primaryImage()) || product.getImages().isEmpty())
                .build();
        if (image.isPrimaryImage()) {
            clearPrimary(product, null);
            product.setImageUrl(image.getUrl());
        }
        product.getImages().add(image);
        return EntityMapper.toProductResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse updateImage(Long productId, Long imageId, ProductImageUpdateRequest request) {
        Product product = getProduct(productId);
        ProductImage image = imageForProduct(productId, imageId);
        if (request.url() != null && !request.url().isBlank() && !request.url().equals(image.getUrl())) {
            fileStorageService.deleteByUrl(image.getUrl());
            image.setUrl(request.url().trim());
        }
        if (request.altText() != null) {
            image.setAltText(normalizeOptional(request.altText()));
        }
        if (request.sortOrder() != null) {
            image.setSortOrder(request.sortOrder());
        }
        if (Boolean.TRUE.equals(request.primaryImage())) {
            clearPrimary(product, image.getId());
            image.setPrimaryImage(true);
            product.setImageUrl(image.getUrl());
        }
        productImageRepository.save(image);
        return EntityMapper.toProductResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse reorderImages(Long productId, ProductImageOrderRequest request) {
        Product product = getProduct(productId);
        Map<Long, Integer> orderById = request.images().stream()
                .collect(Collectors.toMap(ProductImageOrderRequest.Item::id, ProductImageOrderRequest.Item::sortOrder));
        product.getImages().forEach(image -> {
            Integer sortOrder = orderById.get(image.getId());
            if (sortOrder != null) {
                image.setSortOrder(sortOrder);
            }
        });
        return EntityMapper.toProductResponse(productRepository.save(product));
    }

    @Transactional
    public ProductResponse deleteImage(Long productId, Long imageId) {
        Product product = getProduct(productId);
        ProductImage image = imageForProduct(productId, imageId);
        boolean wasPrimary = image.isPrimaryImage();
        product.getImages().removeIf(existing -> existing.getId().equals(imageId));
        productImageRepository.delete(image);
        fileStorageService.deleteByUrl(image.getUrl());
        if (wasPrimary) {
            product.getImages().stream()
                    .findFirst()
                    .ifPresentOrElse(next -> {
                        next.setPrimaryImage(true);
                        product.setImageUrl(next.getUrl());
                    }, () -> product.setImageUrl(null));
        }
        return EntityMapper.toProductResponse(productRepository.save(product));
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
        product.setSlug(resolveSlug(product, request.slug(), request.name()));
        product.setMetaTitle(normalizeOptional(request.metaTitle()));
        product.setMetaDescription(normalizeOptional(request.metaDescription()));
        product.setStockQuantity(request.stockQuantity());
        product.setImageUrl(request.imageUrl());
        product.setCategory(category);
        if (request.active() != null) {
            product.setActive(request.active());
        }
        product.setFeatured(Boolean.TRUE.equals(request.featured()));
        if (request.visibleFrom() != null && request.visibleUntil() != null
                && request.visibleFrom().isAfter(request.visibleUntil())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Visible from must be before visible until");
        }
        product.setVisibleFrom(request.visibleFrom());
        product.setVisibleUntil(request.visibleUntil());
        syncVariants(product, request.variants());
        syncAggregateStock(product);
        return product;
    }

    private String resolveSlug(Product product, String requestedSlug, String name) {
        String slug = slugify(requestedSlug == null || requestedSlug.isBlank() ? name : requestedSlug);
        if (slug.isBlank()) {
            slug = "product";
        }
        boolean conflict = productRepository.findBySlugIgnoreCase(slug)
                .map(existing -> !existing.getId().equals(product.getId()))
                .orElse(false);
        if (conflict) {
            throw new ApiException(HttpStatus.CONFLICT, "Product slug already exists");
        }
        return slug;
    }

    private String slugify(String value) {
        String normalized = Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return normalized.length() > 220 ? normalized.substring(0, 220).replaceAll("-$", "") : normalized;
    }

    private boolean isVisibleNow(Product product) {
        Instant now = Instant.now();
        return (product.getVisibleFrom() == null || !product.getVisibleFrom().isAfter(now))
                && (product.getVisibleUntil() == null || !product.getVisibleUntil().isBefore(now));
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

    private ProductImage imageForProduct(Long productId, Long imageId) {
        return productImageRepository.findByIdAndProductId(imageId, productId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product image not found"));
    }

    private void clearPrimary(Product product, Long exceptImageId) {
        product.getImages().forEach(image -> {
            if (exceptImageId == null || !exceptImageId.equals(image.getId())) {
                image.setPrimaryImage(false);
            }
        });
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
