package personal.ecommercebackend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import personal.ecommercebackend.dto.request.ProductImageOrderRequest;
import personal.ecommercebackend.dto.request.ProductImageRequest;
import personal.ecommercebackend.dto.request.ProductImageUpdateRequest;
import personal.ecommercebackend.dto.request.ProductRequest;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.dto.response.ProductResponse;
import personal.ecommercebackend.service.AuditService;
import personal.ecommercebackend.service.ProductService;

import java.util.List;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final AuditService auditService;

    @GetMapping("/admin/all")
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    public PageResponse<ProductResponse> findAllForAdmin(
            @PageableDefault(size = 100, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return productService.findAllForAdmin(pageable);
    }

    @GetMapping
    public PageResponse<ProductResponse> search(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Boolean inStock,
            @RequestParam(required = false) Integer minRating,
            @PageableDefault(size = 12, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        return productService.search(categoryId, search, minPrice, maxPrice, inStock, minRating, pageable);
    }

    @GetMapping("/featured")
    public List<ProductResponse> featured(@PageableDefault(size = 8, sort = "name") Pageable pageable) {
        return productService.featured(pageable);
    }

    @GetMapping("/{id}")
    public ProductResponse findById(@PathVariable Long id) {
        return productService.findById(id);
    }

    @GetMapping("/slug/{slug}")
    public ProductResponse findBySlug(@PathVariable String slug) {
        return productService.findBySlug(slug);
    }

    @GetMapping("/{id}/related")
    public List<ProductResponse> related(
            @PathVariable Long id,
            @PageableDefault(size = 4) Pageable pageable) {
        return productService.findRelated(id, pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    public ProductResponse create(@Valid @RequestBody ProductRequest request) {
        ProductResponse product = productService.create(request);
        auditService.log("CREATE", "PRODUCT", String.valueOf(product.id()), product.name());
        return product;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    public ProductResponse update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        ProductResponse product = productService.update(id, request);
        auditService.log("UPDATE", "PRODUCT", String.valueOf(product.id()), product.name());
        return product;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    public void delete(@PathVariable Long id) {
        productService.delete(id);
        auditService.log("DEACTIVATE", "PRODUCT", String.valueOf(id), null);
    }

    @PostMapping("/{id}/images")
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse addImage(@PathVariable Long id, @Valid @RequestBody ProductImageRequest request) {
        ProductResponse product = productService.addImage(id, request);
        auditService.log("ADD_IMAGE", "PRODUCT", String.valueOf(id), request.url());
        return product;
    }

    @PutMapping("/{id}/images/{imageId}")
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    public ProductResponse updateImage(
            @PathVariable Long id,
            @PathVariable Long imageId,
            @Valid @RequestBody ProductImageUpdateRequest request) {
        ProductResponse product = productService.updateImage(id, imageId, request);
        auditService.log("UPDATE_IMAGE", "PRODUCT", String.valueOf(id), String.valueOf(imageId));
        return product;
    }

    @PutMapping("/{id}/images/order")
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    public ProductResponse reorderImages(@PathVariable Long id, @Valid @RequestBody ProductImageOrderRequest request) {
        ProductResponse product = productService.reorderImages(id, request);
        auditService.log("REORDER_IMAGES", "PRODUCT", String.valueOf(id), null);
        return product;
    }

    @DeleteMapping("/{id}/images/{imageId}")
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    public ProductResponse deleteImage(@PathVariable Long id, @PathVariable Long imageId) {
        ProductResponse product = productService.deleteImage(id, imageId);
        auditService.log("DELETE_IMAGE", "PRODUCT", String.valueOf(id), String.valueOf(imageId));
        return product;
    }
}
