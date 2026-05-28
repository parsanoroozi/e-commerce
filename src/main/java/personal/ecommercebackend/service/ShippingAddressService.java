package personal.ecommercebackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.ResolvedShipping;
import personal.ecommercebackend.dto.request.CheckoutRequest;
import personal.ecommercebackend.dto.request.ShippingAddressRequest;
import personal.ecommercebackend.dto.response.ShippingAddressResponse;
import personal.ecommercebackend.entity.ShippingAddress;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.repository.ShippingAddressRepository;
import personal.ecommercebackend.repository.UserRepository;
import personal.ecommercebackend.security.SecurityUtils;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShippingAddressService {

    private final ShippingAddressRepository shippingAddressRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ShippingAddressResponse> listMine() {
        return shippingAddressRepository
                .findByUserIdOrderByIsDefaultDescLastUsedAtDescCreatedAtDesc(SecurityUtils.currentUserId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ShippingAddressResponse create(ShippingAddressRequest request) {
        Long userId = SecurityUtils.currentUserId();
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        ShippingAddress address = saveOrFindExisting(user, request);
        if (Boolean.TRUE.equals(request.isDefault()) || shippingAddressRepository.countByUserId(userId) == 1) {
            setAsDefault(address);
        }
        return toResponse(address);
    }

    @Transactional
    public ShippingAddressResponse update(Long id, ShippingAddressRequest request) {
        ShippingAddress address = getOwned(id);
        address.setLabel(normalizeLabel(request.label()));
        address.setStreet(request.street().trim());
        address.setCity(request.city().trim());
        address.setZipCode(request.zipCode().trim());
        address.setCountry(request.country().trim());
        if (Boolean.TRUE.equals(request.isDefault())) {
            setAsDefault(address);
        }
        return toResponse(shippingAddressRepository.save(address));
    }

    @Transactional
    public void delete(Long id) {
        ShippingAddress address = getOwned(id);
        boolean wasDefault = address.isDefault();
        Long userId = address.getUser().getId();
        shippingAddressRepository.delete(address);

        if (wasDefault) {
            shippingAddressRepository
                    .findByUserIdOrderByIsDefaultDescLastUsedAtDescCreatedAtDesc(userId)
                    .stream()
                    .findFirst()
                    .ifPresent(this::setAsDefault);
        }
    }

    @Transactional
    public ShippingAddressResponse setDefault(Long id) {
        ShippingAddress address = getOwned(id);
        setAsDefault(address);
        return toResponse(address);
    }

    @Transactional
    public ResolvedShipping resolveForCheckout(CheckoutRequest request) {
        Long userId = SecurityUtils.currentUserId();

        if (request.shippingAddressId() != null) {
            ShippingAddress address = getOwned(request.shippingAddressId());
            if (!address.getUser().getId().equals(userId)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Address does not belong to you");
            }
            address.setLastUsedAt(Instant.now());
            setAsDefault(address);
            return toResolved(address);
        }

        validateManualAddress(request);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));

        ShippingAddressRequest saveRequest = new ShippingAddressRequest(
                request.label(),
                request.shippingStreet().trim(),
                request.shippingCity().trim(),
                request.shippingZipCode().trim(),
                request.shippingCountry().trim(),
                true);

        ShippingAddress saved = saveOrFindExisting(user, saveRequest);
        saved.setLastUsedAt(Instant.now());
        setAsDefault(saved);
        return toResolved(saved);
    }

    private ShippingAddress saveOrFindExisting(User user, ShippingAddressRequest request) {
        String street = request.street().trim();
        String city = request.city().trim();
        String zip = request.zipCode().trim();
        String country = request.country().trim();

        return shippingAddressRepository
                .findByUserIdAndStreetIgnoreCaseAndCityIgnoreCaseAndZipCodeAndCountryIgnoreCase(
                        user.getId(), street, city, zip, country)
                .map(existing -> {
                    if (request.label() != null && !request.label().isBlank()) {
                        existing.setLabel(normalizeLabel(request.label()));
                    }
                    return shippingAddressRepository.save(existing);
                })
                .orElseGet(() -> {
                    boolean first = shippingAddressRepository.countByUserId(user.getId()) == 0;
                    ShippingAddress address = ShippingAddress.builder()
                            .user(user)
                            .label(normalizeLabel(request.label()))
                            .street(street)
                            .city(city)
                            .zipCode(zip)
                            .country(country)
                            .isDefault(first || Boolean.TRUE.equals(request.isDefault()))
                            .build();
                    return shippingAddressRepository.save(address);
                });
    }

    private void setAsDefault(ShippingAddress address) {
        shippingAddressRepository.clearDefaultForUser(address.getUser().getId());
        address.setDefault(true);
        shippingAddressRepository.save(address);
    }

    private ShippingAddress getOwned(Long id) {
        return shippingAddressRepository.findByIdAndUserId(id, SecurityUtils.currentUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Address not found"));
    }

    private void validateManualAddress(CheckoutRequest request) {
        if (isBlank(request.shippingStreet()) || isBlank(request.shippingCity())
                || isBlank(request.shippingZipCode()) || isBlank(request.shippingCountry())) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Provide a saved address or fill in all shipping fields");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String normalizeLabel(String label) {
        return label == null || label.isBlank() ? null : label.trim();
    }

    private ResolvedShipping toResolved(ShippingAddress address) {
        return new ResolvedShipping(
                address.getStreet(),
                address.getCity(),
                address.getZipCode(),
                address.getCountry());
    }

    private ShippingAddressResponse toResponse(ShippingAddress address) {
        return new ShippingAddressResponse(
                address.getId(),
                address.getLabel(),
                address.getStreet(),
                address.getCity(),
                address.getZipCode(),
                address.getCountry(),
                address.isDefault(),
                address.getLastUsedAt());
    }
}
