package personal.ecommercebackend.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({StripeProperties.class, StorageProperties.class, PaymentProperties.class})
public class AppPropertiesConfig {}
