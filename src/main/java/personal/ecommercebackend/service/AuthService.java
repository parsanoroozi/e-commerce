package personal.ecommercebackend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.ecommercebackend.dto.request.LoginRequest;
import personal.ecommercebackend.dto.request.RegisterRequest;
import personal.ecommercebackend.dto.response.AuthResponse;
import personal.ecommercebackend.dto.response.UserResponse;
import personal.ecommercebackend.entity.Cart;
import personal.ecommercebackend.entity.Role;
import personal.ecommercebackend.entity.User;
import personal.ecommercebackend.exception.ApiException;
import personal.ecommercebackend.mapper.EntityMapper;
import personal.ecommercebackend.repository.UserRepository;
import personal.ecommercebackend.security.JwtService;
import personal.ecommercebackend.security.SecurityUtils;
import personal.ecommercebackend.security.UserPrincipal;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = User.builder()
                .email(request.email().toLowerCase().trim())
                .password(passwordEncoder.encode(request.password()))
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .role(Role.CUSTOMER)
                .build();

        Cart cart = Cart.builder().user(user).build();
        user.setCart(cart);

        user = userRepository.save(user);
        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, EntityMapper.toUserResponse(user));
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email().toLowerCase().trim(),
                        request.password()));

        User user = userRepository.findByEmail(request.email().toLowerCase().trim())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        UserPrincipal principal = new UserPrincipal(user);
        String token = jwtService.generateToken(principal);
        return new AuthResponse(token, EntityMapper.toUserResponse(user));
    }

    @Transactional(readOnly = true)
    public UserResponse me() {
        User user = userRepository.findById(SecurityUtils.currentUserId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
        return EntityMapper.toUserResponse(user);
    }
}
