package personal.ecommercebackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;
import personal.ecommercebackend.dto.response.NotificationResponse;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.service.NotificationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public PageResponse<NotificationResponse> list(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return notificationService.listMine(pageable);
    }

    @GetMapping("/recent")
    public List<NotificationResponse> recent() {
        return notificationService.listMine();
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount() {
        return Map.of("count", notificationService.unreadCount());
    }

    @PatchMapping("/{id}/read")
    public void markRead(@PathVariable Long id) {
        notificationService.markRead(id);
    }

    @PatchMapping("/read-all")
    public void markAllRead() {
        notificationService.markAllRead();
    }

    @DeleteMapping
    public void clearMine() {
        notificationService.clearMine();
    }
}
