package personal.ecommercebackend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.dto.response.UserResponse;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.*;
import personal.ecommercebackend.security.SecurityUtils;
import personal.ecommercebackend.service.AdminUserService;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final WishlistItemRepository wishlistItemRepository;
    private final ShippingAddressRepository shippingAddressRepository;
    private final ProductReviewRepository productReviewRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> list(Pageable pageable) {
        return PageResponse.from(userRepository
                .findAllByOrderByCreatedAtDesc(pageable)
                .map(EntityMapper::toUserResponse));
    }

    @Transactional
    public void delete(Long id) {
        if (id.equals(SecurityUtils.currentUserId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot delete your own admin account");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        notificationRepository.deleteByUserId(id);
        passwordResetTokenRepository.deleteByUserId(id);
        productReviewRepository.deleteByUserId(id);
        wishlistItemRepository.deleteByUserId(id);
        shippingAddressRepository.deleteByUserId(id);
        cartRepository.deleteByUserId(id);
        orderRepository.deleteAll(orderRepository.findByUserId(id));
        userRepository.delete(user);
    }
}
