package personal.ecommercebackend.storage;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import personal.ecommercebackend.config.StorageProperties;
import personal.ecommercebackend.exception.ApiException;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "cloudinary")
@RequiredArgsConstructor
@Slf4j
public class CloudinaryFileStorageService implements FileStorageService {

    private final StorageProperties storageProperties;
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Override
    public String store(MultipartFile file) {
        validateConfig();
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File is empty");
        }
        if (file.getSize() > storageProperties.maxFileSizeBytes()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File exceeds maximum size");
        }

        String boundary = "----ShopVerse" + UUID.randomUUID();
        long timestamp = Instant.now().getEpochSecond();
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("api_key", storageProperties.cloudinaryApiKey());
        fields.put("timestamp", String.valueOf(timestamp));
        if (StringUtils.hasText(storageProperties.cloudinaryFolder())) {
            fields.put("folder", storageProperties.cloudinaryFolder());
        }
        fields.put("signature", sign(fields));

        try {
            byte[] body = multipartBody(boundary, fields, file);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.cloudinary.com/v1_1/"
                            + url(storageProperties.cloudinaryCloudName()) + "/image/upload"))
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Cloudinary upload failed status={} body={}", response.statusCode(), response.body());
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Cloud image upload failed");
            }
            return extractSecureUrl(response.body());
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read upload file");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Cloud image upload interrupted");
        }
    }

    @Override
    public void deleteByUrl(String url) {
        validateConfig();
        String publicId = publicIdFromUrl(url);
        if (!StringUtils.hasText(publicId)) {
            return;
        }
        long timestamp = Instant.now().getEpochSecond();
        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("public_id", publicId);
        fields.put("timestamp", String.valueOf(timestamp));
        fields.put("api_key", storageProperties.cloudinaryApiKey());
        fields.put("signature", sign(Map.of("public_id", publicId, "timestamp", String.valueOf(timestamp))));
        String form = fields.entrySet().stream()
                .map(e -> url(e.getKey()) + "=" + url(e.getValue()))
                .reduce((a, b) -> a + "&" + b)
                .orElse("");
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.cloudinary.com/v1_1/"
                            + url(storageProperties.cloudinaryCloudName()) + "/image/destroy"))
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(form))
                    .build();
            httpClient.send(request, HttpResponse.BodyHandlers.discarding());
        } catch (IOException | InterruptedException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("Cloudinary delete failed for {}", url);
        }
    }

    private byte[] multipartBody(String boundary, Map<String, String> fields, MultipartFile file) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (Map.Entry<String, String> field : fields.entrySet()) {
            out.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
            out.write(("Content-Disposition: form-data; name=\"" + field.getKey() + "\"\r\n\r\n").getBytes(StandardCharsets.UTF_8));
            out.write(field.getValue().getBytes(StandardCharsets.UTF_8));
            out.write("\r\n".getBytes(StandardCharsets.UTF_8));
        }
        out.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Disposition: form-data; name=\"file\"; filename=\"" + file.getOriginalFilename() + "\"\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(("Content-Type: " + file.getContentType() + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        out.write(file.getBytes());
        out.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
        return out.toByteArray();
    }

    private String sign(Map<String, String> fields) {
        String payload = fields.entrySet().stream()
                .filter(e -> !e.getKey().equals("api_key") && !e.getKey().equals("signature"))
                .sorted(Map.Entry.comparingByKey())
                .map(e -> e.getKey() + "=" + e.getValue())
                .reduce((a, b) -> a + "&" + b)
                .orElse("") + storageProperties.cloudinaryApiSecret();
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-1");
            return HexFormat.of().formatHex(digest.digest(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Cloud upload signing unavailable");
        }
    }

    private String extractSecureUrl(String json) {
        int key = json.indexOf("\"secure_url\"");
        if (key < 0) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Cloud upload response missing secure URL");
        }
        int colon = json.indexOf(':', key);
        int start = json.indexOf('"', colon + 1) + 1;
        int end = json.indexOf('"', start);
        return json.substring(start, end).replace("\\/", "/");
    }

    private String publicIdFromUrl(String url) {
        if (!StringUtils.hasText(url) || !url.contains("/upload/")) {
            return null;
        }
        String path = url.substring(url.indexOf("/upload/") + "/upload/".length());
        path = path.replaceFirst("^v\\d+/", "");
        int dot = path.lastIndexOf('.');
        return dot > 0 ? path.substring(0, dot) : path;
    }

    private void validateConfig() {
        if (!StringUtils.hasText(storageProperties.cloudinaryCloudName())
                || !StringUtils.hasText(storageProperties.cloudinaryApiKey())
                || !StringUtils.hasText(storageProperties.cloudinaryApiSecret())) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Cloudinary storage is not configured");
        }
    }

    private String url(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
