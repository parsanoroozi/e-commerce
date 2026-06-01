package personal.ecommercebackend.service;

import org.springframework.data.domain.Pageable;
import personal.ecommercebackend.dto.request.InventoryAdjustmentRequest;
import personal.ecommercebackend.dto.response.InventoryAdjustmentResponse;
import personal.ecommercebackend.dto.response.PageResponse;

public interface InventoryService {
    InventoryAdjustmentResponse adjust(InventoryAdjustmentRequest request);
    PageResponse<InventoryAdjustmentResponse> history(Pageable pageable);
}
