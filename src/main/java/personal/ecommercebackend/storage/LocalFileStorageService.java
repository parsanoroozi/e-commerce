package personal.ecommercebackend.storage;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import personal.ecommercebackend.config.StorageProperties;
import personal.ecommercebackend.exception.ApiException;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
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
        if (!contentMatchesType(file, contentType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File content does not match the declared image type");
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

        String url = "/uploads/" + filename;
        log.info("Stored upload filename={} size={} contentType={}", filename, file.getSize(), contentType);
        return url;
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

    private boolean contentMatchesType(MultipartFile file, String contentType) {
        try (InputStream input = file.getInputStream()) {
            byte[] header = input.readNBytes(12);
            return switch (contentType) {
                case "image/jpeg" -> header.length >= 3
                        && (header[0] & 0xFF) == 0xFF
                        && (header[1] & 0xFF) == 0xD8
                        && (header[2] & 0xFF) == 0xFF;
                case "image/png" -> header.length >= 8
                        && (header[0] & 0xFF) == 0x89
                        && header[1] == 0x50
                        && header[2] == 0x4E
                        && header[3] == 0x47
                        && header[4] == 0x0D
                        && header[5] == 0x0A
                        && header[6] == 0x1A
                        && header[7] == 0x0A;
                case "image/gif" -> header.length >= 6
                        && header[0] == 0x47
                        && header[1] == 0x49
                        && header[2] == 0x46
                        && header[3] == 0x38
                        && (header[4] == 0x37 || header[4] == 0x39)
                        && header[5] == 0x61;
                case "image/webp" -> header.length >= 12
                        && header[0] == 0x52
                        && header[1] == 0x49
                        && header[2] == 0x46
                        && header[3] == 0x46
                        && header[8] == 0x57
                        && header[9] == 0x45
                        && header[10] == 0x42
                        && header[11] == 0x50;
                default -> false;
            };
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Failed to read file content");
        }
    }
}
