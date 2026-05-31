package personal.ecommercebackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import personal.ecommercebackend.entity.EmailVerificationCode;

import java.util.Optional;

public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, Long> {

    Optional<EmailVerificationCode> findTopByEmailAndUsedFalseOrderByCreatedAtDesc(String email);
}
