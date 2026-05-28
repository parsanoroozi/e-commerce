package personal.ecommercebackend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.storage")
public record StorageProperties(
        String type,
        String uploadDir,
        long maxFileSizeBytes
) {}
