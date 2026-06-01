package personal.ecommercebackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import personal.ecommercebackend.entity.AdminTwoFactorChallenge;

import java.util.Optional;

public interface AdminTwoFactorChallengeRepository extends JpaRepository<AdminTwoFactorChallenge, Long> {
    Optional<AdminTwoFactorChallenge> findByChallengeId(String challengeId);
}
