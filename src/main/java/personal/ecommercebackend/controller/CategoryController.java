package personal.ecommercebackend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import personal.ecommercebackend.dto.request.CategoryRequest;
import personal.ecommercebackend.dto.response.CategoryResponse;
import personal.ecommercebackend.service.AuditService;
import personal.ecommercebackend.service.CategoryService;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final AuditService auditService;

    @GetMapping
    public List<CategoryResponse> findAll() {
        return categoryService.findAll();
    }

    @GetMapping("/{id}")
    public CategoryResponse findById(@PathVariable Long id) {
        return categoryService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    public CategoryResponse create(@Valid @RequestBody CategoryRequest request) {
        CategoryResponse category = categoryService.create(request);
        auditService.log("CREATE", "CATEGORY", String.valueOf(category.id()), category.name());
        return category;
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    public CategoryResponse update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request) {
        CategoryResponse category = categoryService.update(id, request);
        auditService.log("UPDATE", "CATEGORY", String.valueOf(category.id()), category.name());
        return category;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAuthority('MANAGE_CATALOG')")
    public void delete(@PathVariable Long id) {
        categoryService.delete(id);
        auditService.log("DELETE", "CATEGORY", String.valueOf(id), null);
    }
}
