package personal.ecommercebackend.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
public class MailConfig {

    @Bean
    ApplicationRunner mailStartupLogger(
            @Value("${app.mail.enabled:false}") boolean enabled,
            @Value("${spring.mail.host:localhost}") String host,
            @Value("${spring.mail.port:1025}") int port) {
        return args -> {
            if (enabled) {
                log.info("Email delivery ENABLED — SMTP {}:{} (view MailHog UI at http://localhost:8025)", host, port);
            } else {
                log.warn("Email delivery DISABLED — set MAIL_ENABLED=true and run MailHog (docker compose up -d mailhog)");
            }
        };
    }
}
