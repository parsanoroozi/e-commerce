package personal.ecommercebackend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.response.SessionResponse;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.entity.UserSession;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.repository.UserSessionRepository;
import personal.ecommercebackend.security.SecurityUtils;
import personal.ecommercebackend.service.SessionService;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {

    private final UserSessionRepository userSessionRepository;

    @Transactional
    public String create(User user, String userAgent, String ipAddress, Instant expiresAt) {
        String tokenId = UUID.randomUUID().toString();
        userSessionRepository.save(UserSession.builder()
                .user(user)
                .tokenId(tokenId)
                .userAgent(truncate(userAgent, 500))
                .ipAddress(truncate(ipAddress, 80))
                .expiresAt(expiresAt)
                .lastSeenAt(Instant.now())
                .build());
        return tokenId;
    }

    @Transactional
    public boolean touchIfValid(String tokenId) {
        return userSessionRepository.findByTokenId(tokenId)
                .filter(session -> !session.isRevoked())
                .filter(session -> session.getExpiresAt().isAfter(Instant.now()))
                .map(session -> {
                    session.setLastSeenAt(Instant.now());
                    userSessionRepository.save(session);
                    return true;
                })
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> listMine(String currentTokenId) {
        Long userId = SecurityUtils.currentUserId();
        return userSessionRepository.findByUserIdOrderByLastSeenAtDesc(userId).stream()
                .map(session -> toResponse(session, session.getTokenId().equals(currentTokenId)))
                .toList();
    }

    @Transactional
    public void revokeMine(Long sessionId) {
        UserSession session = userSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Session not found"));
        if (!session.getUser().getId().equals(SecurityUtils.currentUserId())) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Session not found");
        }
        revoke(session);
    }

    @Transactional
    public void revokeToken(String tokenId) {
        if (tokenId == null) {
            return;
        }
        userSessionRepository.findByTokenId(tokenId).ifPresent(this::revoke);
    }

    private void revoke(UserSession session) {
        session.setRevoked(true);
        session.setRevokedAt(Instant.now());
        userSessionRepository.save(session);
    }

    private SessionResponse toResponse(UserSession session, boolean current) {
        return new SessionResponse(
                session.getId(),
                session.getUserAgent(),
                session.getIpAddress(),
                session.getCreatedAt(),
                session.getLastSeenAt(),
                session.getExpiresAt(),
                current,
                session.isRevoked());
    }

    private String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() > max ? value.substring(0, max) : value;
    }
}
