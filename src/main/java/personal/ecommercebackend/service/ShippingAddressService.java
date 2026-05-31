package personal.ecommercebackend.service;

import org.springframework.data.domain.Pageable;
import personal.ecommercebackend.dto.request.*;
import personal.ecommercebackend.dto.response.*;
import personal.ecommercebackend.dto.*;
import personal.ecommercebackend.entity.*;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;
import com.stripe.model.PaymentIntent;

public interface ShippingAddressService {
    List<ShippingAddressResponse> listMine();
    PageResponse<ShippingAddressResponse> listMine(Pageable pageable);
    ShippingAddressResponse create(ShippingAddressRequest request);
    ShippingAddressResponse update(Long id, ShippingAddressRequest request);
    void delete(Long id);
    ShippingAddressResponse setDefault(Long id);
    ResolvedShipping resolveForCheckout(CheckoutRequest request);
}
