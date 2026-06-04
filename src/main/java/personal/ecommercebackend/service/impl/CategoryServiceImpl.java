package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.request.CategoryRequest;
import personal.ecommercebackend.dto.response.CategoryResponse;
import personal.ecommercebackend.entity.Category;
import personal.ecommercebackend.entity.CategoryVariantOption;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.CategoryRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll() {
        return categoryRepository.findAllByOrderByDisplayOrderAscNameAsc().stream()
                .map(EntityMapper::toCategoryResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse findById(Long id) {
        return EntityMapper.toCategoryResponse(getCategory(id));
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.name())) {
            throw new ApiException(HttpStatus.CONFLICT, "Category already exists");
        }
        Category category = Category.builder()
                .name(request.name().trim())
                .description(request.description())
                .displayOrder(request.displayOrder() == null ? 0 : request.displayOrder())
                .parent(resolveParent(request.parentId(), null))
                .lowStockThreshold(resolveThreshold(request.lowStockThreshold()))
                .taxRate(normalizeRate(request.taxRate()))
                .variantOptions(toVariantOptions(request))
                .build();
        return EntityMapper.toCategoryResponse(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = getCategory(id);
        categoryRepository.findByNameIgnoreCase(request.name())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(c -> {
                    throw new ApiException(HttpStatus.CONFLICT, "Category name already in use");
                });
        category.setName(request.name().trim());
        category.setDescription(request.description());
        category.setDisplayOrder(request.displayOrder() == null ? 0 : request.displayOrder());
        category.setParent(resolveParent(request.parentId(), id));
        category.setLowStockThreshold(resolveThreshold(request.lowStockThreshold()));
        category.setTaxRate(normalizeRate(request.taxRate()));
        category.getVariantOptions().clear();
        category.getVariantOptions().addAll(toVariantOptions(request));
        return EntityMapper.toCategoryResponse(categoryRepository.save(category));
    }

    @Transactional
    public void delete(Long id) {
        Category category = getCategory(id);
        if (!category.getChildren().isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "Cannot delete category with child categories");
        }
        if (!category.getProducts().isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "Cannot delete category with products");
        }
        categoryRepository.delete(category);
    }

    private Category resolveParent(Long parentId, Long categoryId) {
        if (parentId == null) {
            return null;
        }
        if (parentId.equals(categoryId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Category cannot be its own parent");
        }
        Category parent = getCategory(parentId);
        Category cursor = parent.getParent();
        while (cursor != null) {
            if (cursor.getId().equals(categoryId)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Category hierarchy cannot contain cycles");
            }
            cursor = cursor.getParent();
        }
        return parent;
    }

    private int resolveThreshold(Integer threshold) {
        return threshold == null ? 10 : threshold;
    }

    private BigDecimal normalizeRate(BigDecimal rate) {
        return rate == null ? null : rate;
    }

    private List<CategoryVariantOption> toVariantOptions(CategoryRequest request) {
        if (request.variantOptions() == null) {
            return List.of();
        }
        List<personal.ecommercebackend.dto.request.CategoryVariantOptionRequest> options = request.variantOptions().stream()
                .filter(Objects::nonNull)
                .toList();
        Set<String> seen = options.stream()
                .map(option -> normalizeAttributeName(option.name()).toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
        if (seen.size() != options.size()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Category variant attributes must be unique");
        }
        return options.stream()
                .map(option -> CategoryVariantOption.builder()
                        .name(normalizeAttributeName(option.name()))
                        .displayOrder(option.displayOrder() == null ? 0 : option.displayOrder())
                        .build())
                .toList();
    }

    private String normalizeAttributeName(String value) {
        String normalized = normalizeValue(value);
        if (normalized.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Variant attribute name is required");
        }
        return normalized;
    }

    private String normalizeValue(String value) {
        return value == null ? "" : value.trim();
    }

    @Override
    public Category getCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category not found"));
    }
}
