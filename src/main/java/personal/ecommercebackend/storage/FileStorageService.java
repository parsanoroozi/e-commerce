package personal.ecommercebackend.storage;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    String store(MultipartFile file);

    void deleteByUrl(String url);
}
