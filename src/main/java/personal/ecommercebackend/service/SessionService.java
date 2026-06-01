package personal.ecommercebackend.service;

import personal.ecommercebackend.dto.response.SessionResponse;
import personal.ecommercebackend.entity.User;

import java.time.Instant;
import java.util.List;

public interface SessionService {
    String create(User user, String userAgent, String ipAddress, Instant expiresAt);
    boolean touchIfValid(String tokenId);
    List<SessionResponse> listMine(String currentTokenId);
    void revokeMine(Long sessionId);
    void revokeToken(String tokenId);
}
