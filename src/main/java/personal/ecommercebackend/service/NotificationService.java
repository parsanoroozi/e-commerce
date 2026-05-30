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

public interface NotificationService {
    void notifyUser(User user, String title, String message, Long orderId);
    List<NotificationResponse> listMine();
    long unreadCount();
    void markRead(Long id);
    void markAllRead();
}
