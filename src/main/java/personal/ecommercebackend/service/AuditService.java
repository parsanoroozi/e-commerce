package personal.ecommercebackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.response.AuditLogResponse;
import personal.ecommercebackend.dto.response.PageResponse;
import personal.ecommercebackend.entity.AuditLog;
import personal.ecommercebackend.repository.AuditLogRepository;
import personal.ecommercebackend.security.SecurityUtils;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional
    public void log(String action, String entityType, String entityId, String details) {
        auditLogRepository.save(AuditLog.builder()
                .adminEmail(SecurityUtils.currentUser().getEmail())
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .build());
    }

    @Transactional(readOnly = true)
    public PageResponse<AuditLogResponse> list(Pageable pageable) {
        return PageResponse.from(auditLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(a -> new AuditLogResponse(a.getId(), a.getAdminEmail(), a.getAction(),
                        a.getEntityType(), a.getEntityId(), a.getDetails(), a.getCreatedAt())));
    }
}
