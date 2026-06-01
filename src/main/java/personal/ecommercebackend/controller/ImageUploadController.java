package personal.ecommercebackend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import personal.ecommercebackend.dto.response.ImageUploadResponse;
import personal.ecommercebackend.service.ImageUploadService;

@RestController
@RequestMapping("/api/admin/images")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('MANAGE_CATALOG')")
public class ImageUploadController {

    private final ImageUploadService imageUploadService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ImageUploadResponse upload(@RequestParam("file") MultipartFile file) {
        return imageUploadService.upload(file);
    }
}
