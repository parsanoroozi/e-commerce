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

public interface ProductService {
    PageResponse<ProductResponse> findAllForAdmin(Pageable pageable);
    PageResponse<ProductResponse> search(Long categoryId, String search, Pageable pageable);
    ProductResponse findById(Long id);
    List<ProductResponse> findRelated(Long id, Pageable pageable);
    ProductResponse create(ProductRequest request);
    ProductResponse update(Long id, ProductRequest request);
    void delete(Long id);

    Product getProduct(Long id);
    ProductVariant getVariant(Long productId, Long variantId);
}
