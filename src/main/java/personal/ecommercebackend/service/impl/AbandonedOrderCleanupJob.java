package personal.ecommercebackend.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import personal.ecommercebackend.service.OrderService;

@Component
@RequiredArgsConstructor
@Slf4j
public class AbandonedOrderCleanupJob {

    private final OrderService orderService;

    @Scheduled(fixedDelayString = "${app.orders.abandoned-cleanup-delay-ms:300000}")
    public void cancelAbandonedOrders() {
        int cancelled = orderService.cancelAbandonedOrders();
        if (cancelled > 0) {
            log.info("Abandoned order cleanup cancelled {} orders", cancelled);
        }
    }
}
