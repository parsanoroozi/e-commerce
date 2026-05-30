package personal.ecommercebackend.service.impl;

import personal.ecommercebackend.service.*;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import personal.ecommercebackend.dto.response.ImageUploadResponse;
import personal.ecommercebackend.storage.FileStorageService;

@Service
@RequiredArgsConstructor
public class ImageUploadServiceImpl implements ImageUploadService {

    private final FileStorageService fileStorageService;

    public ImageUploadResponse upload(MultipartFile file) {
        String url = fileStorageService.store(file);
        return new ImageUploadResponse(url);
    }
}
