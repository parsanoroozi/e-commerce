package personal.ecommercebackend.storage;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import personal.ecommercebackend.config.StorageProperties;
import personal.ecommercebackend.exception.ApiException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
@RequiredArgsConstructor
public class LocalFileStorageService implements FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif");

    private final StorageProperties storageProperties;
    private Path uploadRoot;

    @PostConstruct
    void init() throws IOException {
        uploadRoot = Path.of(storageProperties.uploadDir()).toAbsolutePath().normalize();
        Files.createDirectories(uploadRoot);
    }

    @Override
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File is empty");
        }
        if (file.getSize() > storageProperties.maxFileSizeBytes()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File exceeds maximum size");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only JPEG, PNG, WebP, and GIF images are allowed");
        }

        String extension = extensionFromContentType(contentType);
        String filename = UUID.randomUUID() + extension;
        Path target = uploadRoot.resolve(filename).normalize();

        if (!target.startsWith(uploadRoot)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid file path");
        }

        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store file");
        }

        return "/uploads/" + filename;
    }

    @Override
    public void deleteByUrl(String url) {
        if (!StringUtils.hasText(url) || !url.startsWith("/uploads/")) {
            return;
        }
        String filename = url.substring("/uploads/".length());
        Path target = uploadRoot.resolve(filename).normalize();
        if (target.startsWith(uploadRoot)) {
            try {
                Files.deleteIfExists(target);
            } catch (IOException ignored) {
                // best effort
            }
        }
    }

    private String extensionFromContentType(String contentType) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> ".jpg";
        };
    }
}
