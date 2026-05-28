package personal.ecommercebackend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import personal.ecommercebackend.dto.request.ShippingAddressRequest;
import personal.ecommercebackend.dto.response.ShippingAddressResponse;
import personal.ecommercebackend.service.ShippingAddressService;

import java.util.List;

@RestController
@RequestMapping("/api/shipping-addresses")
@RequiredArgsConstructor
public class ShippingAddressController {

    private final ShippingAddressService shippingAddressService;

    @GetMapping
    public List<ShippingAddressResponse> listMine() {
        return shippingAddressService.listMine();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShippingAddressResponse create(@Valid @RequestBody ShippingAddressRequest request) {
        return shippingAddressService.create(request);
    }

    @PutMapping("/{id}")
    public ShippingAddressResponse update(
            @PathVariable Long id,
            @Valid @RequestBody ShippingAddressRequest request) {
        return shippingAddressService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        shippingAddressService.delete(id);
    }

    @PatchMapping("/{id}/default")
    public ShippingAddressResponse setDefault(@PathVariable Long id) {
        return shippingAddressService.setDefault(id);
    }
}
