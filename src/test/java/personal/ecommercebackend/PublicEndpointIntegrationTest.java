package personal.ecommercebackend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicEndpointIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void storefrontSettingsArePublicForHomepageIntegration() throws Exception {
        mockMvc.perform(get("/api/storefront/settings"))
                .andExpect(status().isOk());
    }

    @Test
    void productCatalogIsPublicWithOptionalFilters() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("page", "0")
                        .param("size", "12")
                        .param("sort", "name,asc"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/products")
                        .param("page", "0")
                        .param("size", "12")
                        .param("search", "watch")
                        .param("minPrice", "10")
                        .param("maxPrice", "500")
                        .param("inStock", "true")
                        .param("minRating", "3")
                        .param("sort", "price,asc"))
                .andExpect(status().isOk());
    }
}
