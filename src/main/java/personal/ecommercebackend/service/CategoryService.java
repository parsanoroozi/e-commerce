package personal.ecommercebackend.service;

import org.springframework.data.domain.Pageable;
import personal.ecommercebackend.dto.request.*;
import personal.ecommercebackend.dto.response.*;
import personal.ecommercebackend.dto.*;
import personal.ecommercebackend.entity.*;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import com.stripe.model.PaymentIntent;

public interface CategoryService {
    List<CategoryResponse> findAll();
    CategoryResponse findById(Long id);
    CategoryResponse create(CategoryRequest request);
    CategoryResponse update(Long id, CategoryRequest request);
    void delete(Long id);

    Category getCategory(Long id);
}
