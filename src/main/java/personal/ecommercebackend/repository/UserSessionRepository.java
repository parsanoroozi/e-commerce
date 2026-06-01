package personal.ecommercebackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import personal.ecommercebackend.entity.UserSession;

import java.util.List;
import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    Optional<UserSession> findByTokenId(String tokenId);
    List<UserSession> findByUserIdOrderByLastSeenAtDesc(Long userId);
}
