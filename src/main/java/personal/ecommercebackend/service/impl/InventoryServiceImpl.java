package personal.ecommercebackend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.request.InventoryAdjustmentRequest;
import personal.ecommercebackend.dto.response.InventoryAdjustmentResponse;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.entity.InventoryAdjustment;
import personal.ecommercebackend.entity.Product;
import personal.ecommercebackend.entity.ProductVariant;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.repository.InventoryAdjustmentRepository;
import personal.ecommercebackend.repository.ProductRepository;
import personal.ecommercebackend.repository.ProductVariantRepository;
import personal.ecommercebackend.repository.UserRepository;
import personal.ecommercebackend.security.SecurityUtils;
import personal.ecommercebackend.service.InventoryService;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryAdjustmentRepository adjustmentRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public InventoryAdjustmentResponse adjust(InventoryAdjustmentRequest request) {
        if (request.quantityDelta() == 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Quantity change must not be zero");
        }

        Product product = productRepository.findByIdForUpdate(request.productId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product not found"));
        ProductVariant variant = null;
        int before;
        int after;

        if (request.variantId() != null) {
            variant = productVariantRepository.findByIdForUpdate(request.variantId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Product variant not found"));
            if (!variant.getProduct().getId().equals(product.getId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Variant does not belong to product");
            }
            before = variant.getStockQuantity();
            after = before + request.quantityDelta();
            if (after < 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Stock cannot go below zero");
            }
            variant.setStockQuantity(after);
            syncAggregateStock(product);
        } else {
            if (!product.getVariants().isEmpty()) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Select a variant to adjust stock for this product");
            }
            before = product.getStockQuantity();
            after = before + request.quantityDelta();
            if (after < 0) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Stock cannot go below zero");
            }
            product.setStockQuantity(after);
        }

        User admin = userRepository.findById(SecurityUtils.currentUserId()).orElse(null);
        InventoryAdjustment saved = adjustmentRepository.save(InventoryAdjustment.builder()
                .product(product)
                .variant(variant)
                .adminUser(admin)
                .quantityDelta(request.quantityDelta())
                .stockBefore(before)
                .stockAfter(after)
                .reason(request.reason().trim())
                .build());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<InventoryAdjustmentResponse> history(Pageable pageable) {
        return PageResponse.from(adjustmentRepository.findAllByOrderByCreatedAtDesc(pageable).map(this::toResponse));
    }

    private void syncAggregateStock(Product product) {
        int total = product.getVariants().stream()
                .filter(ProductVariant::isActive)
                .mapToInt(ProductVariant::getStockQuantity)
                .sum();
        product.setStockQuantity(total);
    }

    private InventoryAdjustmentResponse toResponse(InventoryAdjustment adjustment) {
        ProductVariant variant = adjustment.getVariant();
        return new InventoryAdjustmentResponse(
                adjustment.getId(),
                adjustment.getProduct().getId(),
                adjustment.getProduct().getName(),
                variant == null ? null : variant.getId(),
                variant == null ? null : variant.displayName(),
                variant != null && variant.getSku() != null ? variant.getSku() : adjustment.getProduct().getSku(),
                adjustment.getQuantityDelta(),
                adjustment.getStockBefore(),
                adjustment.getStockAfter(),
                adjustment.getReason(),
                adjustment.getAdminUser() == null ? null : adjustment.getAdminUser().getEmail(),
                adjustment.getCreatedAt()
        );
    }
}
