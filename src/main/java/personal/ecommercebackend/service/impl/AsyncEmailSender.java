package personal.ecommercebackend.service.impl;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.concurrent.CompletableFuture;

@Component
@RequiredArgsConstructor
@Slf4j
public class AsyncEmailSender {

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:noreply@shopverse.local}")
    private String fromAddress;

    @Value("${app.mail.from-name:ShopVerse}")
    private String fromName;

    @Async("emailTaskExecutor")
    public CompletableFuture<Boolean> sendHtml(String to, String subject, String htmlBody, String logContext) {
        if (!mailEnabled) {
            log.info("Email disabled - {}:\n{}", logContext, htmlBody);
            return CompletableFuture.completedFuture(true);
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {} ({})", to, logContext);
            return CompletableFuture.completedFuture(true);
        } catch (Exception e) {
            log.error("Failed to send email to {} ({}) - {}", to, logContext, e.getMessage(), e);
            return CompletableFuture.completedFuture(false);
        }
    }
}
