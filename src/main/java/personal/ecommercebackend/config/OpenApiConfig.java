package personal.ecommercebackend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    @Value("${server.port:8080}")
    private int serverPort;

    @Bean
    public OpenAPI shopVerseOpenApi() {
        final String bearerScheme = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("ShopVerse E-Commerce API")
                        .description("""
                                REST API for ShopVerse: authentication, catalog, cart, checkout, orders,
                                wishlist, reviews, coupons, notifications, and admin operations.
                                Authenticated routes require a JWT from POST /api/auth/login or /api/auth/register.
                                """)
                        .version("1.0.0")
                        .contact(new Contact().name("ShopVerse").email("support@shopverse.local"))
                        .license(new License().name("MIT")))
                .servers(List.of(
                        new Server().url("http://localhost:" + serverPort).description("Local"),
                        new Server().url("http://127.0.0.1:" + serverPort).description("Local (loopback)")))
                .addSecurityItem(new SecurityRequirement().addList(bearerScheme))
                .components(new Components()
                        .addSecuritySchemes(bearerScheme, new SecurityScheme()
                                .name(bearerScheme)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("JWT token from login/register response")));
    }
}
