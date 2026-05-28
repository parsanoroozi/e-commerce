package personal.ecommercebackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.response.NotificationResponse;
import personal.ecommercebackend.entity.Notification;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.repository.NotificationRepository;
import personal.ecommercebackend.security.SecurityUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void notifyUser(User user, String title, String message, Long orderId) {
        notificationRepository.save(Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .relatedOrderId(orderId)
                .read(false)
                .build());
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listMine() {
        return notificationRepository.findTop20ByUserIdOrderByCreatedAtDesc(SecurityUtils.currentUserId())
                .stream()
                .map(n -> new NotificationResponse(n.getId(), n.getTitle(), n.getMessage(), n.isRead(),
                        n.getRelatedOrderId(), n.getCreatedAt()))
                .toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount() {
        return notificationRepository.countByUserIdAndReadFalse(SecurityUtils.currentUserId());
    }

    @Transactional
    public void markRead(Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!n.getUser().getId().equals(SecurityUtils.currentUserId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Not your notification");
        }
        n.setRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllRead() {
        notificationRepository.findTop20ByUserIdOrderByCreatedAtDesc(SecurityUtils.currentUserId())
                .forEach(n -> n.setRead(true));
    }
}
