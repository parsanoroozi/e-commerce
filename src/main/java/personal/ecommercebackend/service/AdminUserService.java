package personal.ecommercebackend.service;

import org.springframework.data.domain.Pageable;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.dto.response.UserResponse;

public interface AdminUserService {
    PageResponse<UserResponse> list(Pageable pageable);
    void delete(Long id);
}
