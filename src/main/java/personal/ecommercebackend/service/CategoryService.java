package personal.ecommercebackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.request.CategoryRequest;
import personal.ecommercebackend.dto.response.CategoryResponse;
import personal.ecommercebackend.entity.Category;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.CategoryRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll().stream()
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
        return EntityMapper.toCategoryResponse(categoryRepository.save(category));
    }

    @Transactional
    public void delete(Long id) {
        Category category = getCategory(id);
        if (!category.getProducts().isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "Cannot delete category with products");
        }
        categoryRepository.delete(category);
    }

    Category getCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category not found"));
    }
}
