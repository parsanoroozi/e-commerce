package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import personal.ecommercebackend.dto.request.NotificationSettingsRequest;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.dto.response.NotificationResponse;
import personal.ecommercebackend.dto.response.NotificationSettingsResponse;
import personal.ecommercebackend.entity.Notification;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.repository.NotificationRepository;
import personal.ecommercebackend.repository.UserRepository;
import personal.ecommercebackend.security.SecurityUtils;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final Map<Long, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    @Transactional
    public void notifyUser(User user, String title, String message, Long orderId) {
        if (!user.isOrderNotificationsEnabled()) {
            return;
        }
        Notification notification = notificationRepository.save(Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .relatedOrderId(orderId)
                .targetUrl(orderId == null ? null : "/orders/" + orderId)
                .read(false)
                .build());
        emit(user, notification);
    }

    @Transactional
    public void notifyProduct(User user, String title, String message, Long productId) {
        if (!user.isProductNotificationsEnabled()) {
            return;
        }
        Notification notification = notificationRepository.save(Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .relatedProductId(productId)
                .targetUrl(productId == null ? null : "/products/" + productId)
                .read(false)
                .build());
        emit(user, notification);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> listMine() {
        return notificationRepository.findTop20ByUserIdOrderByCreatedAtDesc(SecurityUtils.currentUserId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> listMine(Pageable pageable) {
        return PageResponse.from(notificationRepository
                .findByUserIdOrderByCreatedAtDesc(SecurityUtils.currentUserId(), pageable)
                .map(this::toResponse));
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
        notificationRepository.markAllReadForUser(SecurityUtils.currentUserId());
    }

    @Transactional
    public void clearMine() {
        notificationRepository.deleteByUserId(SecurityUtils.currentUserId());
    }

    @Transactional(readOnly = true)
    public NotificationSettingsResponse settings() {
        return toSettings(loadCurrentUser());
    }

    @Transactional
    public NotificationSettingsResponse updateSettings(NotificationSettingsRequest request) {
        User user = loadCurrentUser();
        if (request.orderNotificationsEnabled() != null) {
            user.setOrderNotificationsEnabled(request.orderNotificationsEnabled());
        }
        if (request.productNotificationsEnabled() != null) {
            user.setProductNotificationsEnabled(request.productNotificationsEnabled());
        }
        if (request.realtimeNotificationsEnabled() != null) {
            user.setRealtimeNotificationsEnabled(request.realtimeNotificationsEnabled());
        }
        return toSettings(userRepository.save(user));
    }

    public SseEmitter stream() {
        Long userId = SecurityUtils.currentUserId();
        SseEmitter emitter = new SseEmitter(30L * 60L * 1000L);
        emitters.computeIfAbsent(userId, ignored -> new CopyOnWriteArrayList<>()).add(emitter);
        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError((ignored) -> removeEmitter(userId, emitter));
        try {
            emitter.send(SseEmitter.event().name("ready").data(Map.of("connected", true)));
        } catch (IOException ex) {
            removeEmitter(userId, emitter);
        }
        return emitter;
    }

    private User loadCurrentUser() {
        return userRepository.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private NotificationSettingsResponse toSettings(User user) {
        return new NotificationSettingsResponse(
                user.isOrderNotificationsEnabled(),
                user.isProductNotificationsEnabled(),
                user.isRealtimeNotificationsEnabled());
    }

    private NotificationResponse toResponse(Notification notification) {
        String targetUrl = notification.getTargetUrl();
        if (targetUrl == null && notification.getRelatedOrderId() != null) {
            targetUrl = "/orders/" + notification.getRelatedOrderId();
        }
        if (targetUrl == null && notification.getRelatedProductId() != null) {
            targetUrl = "/products/" + notification.getRelatedProductId();
        }
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.isRead(),
                notification.getRelatedOrderId(),
                notification.getRelatedProductId(),
                targetUrl,
                notification.getCreatedAt());
    }

    private void emit(User user, Notification notification) {
        if (!user.isRealtimeNotificationsEnabled()) {
            return;
        }
        CopyOnWriteArrayList<SseEmitter> userEmitters = emitters.get(user.getId());
        if (userEmitters == null || userEmitters.isEmpty()) {
            return;
        }
        NotificationResponse response = toResponse(notification);
        for (SseEmitter emitter : userEmitters) {
            try {
                emitter.send(SseEmitter.event().name("notification").data(response));
            } catch (IOException | IllegalStateException ex) {
                removeEmitter(user.getId(), emitter);
            }
        }
    }

    private void removeEmitter(Long userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null) {
            return;
        }
        userEmitters.remove(emitter);
        if (userEmitters.isEmpty()) {
            emitters.remove(userId);
        }
    }
}
