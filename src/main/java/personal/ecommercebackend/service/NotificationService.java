package personal.ecommercebackend.service;

import org.springframework.data.domain.Pageable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import personal.ecommercebackend.dto.request.NotificationSettingsRequest;
import personal.ecommercebackend.dto.response.NotificationResponse;
import personal.ecommercebackend.dto.response.NotificationSettingsResponse;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.entity.User;

import java.util.List;

public interface NotificationService {
    void notifyUser(User user, String title, String message, Long orderId);
    void notifyProduct(User user, String title, String message, Long productId);
    List<NotificationResponse> listMine();
    PageResponse<NotificationResponse> listMine(Pageable pageable);
    long unreadCount();
    void markRead(Long id);
    void markAllRead();
    void clearMine();
    NotificationSettingsResponse settings();
    NotificationSettingsResponse updateSettings(NotificationSettingsRequest request);
    SseEmitter stream();
}
