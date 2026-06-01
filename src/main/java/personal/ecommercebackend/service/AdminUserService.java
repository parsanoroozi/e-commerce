package personal.ecommercebackend.service;

import org.springframework.data.domain.Pageable;
import personal.ecommercebackend.dto.request.CustomerManagementRequest;
import personal.ecommercebackend.dto.response.CustomerDetailResponse;
import personal.ecommercebackend.dto.response.CustomerSummaryResponse;
import personal.ecommercebackend.dto.response.PageResponse;

public interface AdminUserService {
    PageResponse<CustomerSummaryResponse> list(Pageable pageable);
    CustomerDetailResponse detail(Long id);
    CustomerDetailResponse updateCustomer(Long id, CustomerManagementRequest request);
    void sendPasswordReset(Long id);
    void delete(Long id);
}
