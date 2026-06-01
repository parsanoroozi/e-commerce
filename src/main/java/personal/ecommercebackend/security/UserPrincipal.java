package personal.ecommercebackend.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import personal.ecommercebackend.entity.User;

import java.util.Collection;
import java.util.ArrayList;
import java.util.List;

@Getter
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String email;
    private final String password;
    private final boolean blocked;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.password = user.getPassword();
        this.blocked = user.isBlocked();
        this.authorities = authoritiesFor(user);
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !blocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return !blocked;
    }

    private Collection<? extends GrantedAuthority> authoritiesFor(User user) {
        List<GrantedAuthority> granted = new ArrayList<>();
        granted.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
        switch (user.getRole()) {
            case ADMIN -> granted.addAll(List.of(
                    new SimpleGrantedAuthority("ADMIN_ACCESS"),
                    new SimpleGrantedAuthority("MANAGE_CATALOG"),
                    new SimpleGrantedAuthority("MANAGE_ORDERS"),
                    new SimpleGrantedAuthority("MANAGE_USERS"),
                    new SimpleGrantedAuthority("MANAGE_SETTINGS"),
                    new SimpleGrantedAuthority("VIEW_AUDIT")));
            case CATALOG_MANAGER -> granted.addAll(List.of(
                    new SimpleGrantedAuthority("ADMIN_ACCESS"),
                    new SimpleGrantedAuthority("MANAGE_CATALOG")));
            case ORDER_MANAGER -> granted.addAll(List.of(
                    new SimpleGrantedAuthority("ADMIN_ACCESS"),
                    new SimpleGrantedAuthority("MANAGE_ORDERS")));
            case FULFILLMENT_STAFF -> granted.addAll(List.of(
                    new SimpleGrantedAuthority("ADMIN_ACCESS"),
                    new SimpleGrantedAuthority("MANAGE_ORDERS")));
            case SUPPORT_STAFF -> granted.addAll(List.of(
                    new SimpleGrantedAuthority("ADMIN_ACCESS"),
                    new SimpleGrantedAuthority("MANAGE_USERS"),
                    new SimpleGrantedAuthority("MANAGE_ORDERS")));
            default -> {
            }
        }
        return granted;
    }
}
