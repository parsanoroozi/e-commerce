package personal.ecommercebackend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriComponentsBuilder;
import personal.ecommercebackend.dto.response.MapSearchResultResponse;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/maps")
public class MapController {

    private static final String USER_AGENT = "ShopVerse/1.0 (local development)";
    private static final Duration MAP_CONNECT_TIMEOUT = Duration.ofSeconds(8);
    private static final Duration MAP_REQUEST_TIMEOUT = Duration.ofSeconds(20);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(MAP_CONNECT_TIMEOUT)
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    @GetMapping("/search")
    public List<MapSearchResultResponse> search(@RequestParam String q) throws Exception {
        URI uri = UriComponentsBuilder
                .fromUriString("https://nominatim.openstreetmap.org/search")
                .queryParam("q", q)
                .queryParam("format", "jsonv2")
                .queryParam("addressdetails", 1)
                .queryParam("accept-language", "fa,en")
                .queryParam("namedetails", 1)
                .queryParam("limit", 10)
                .build()
                .encode()
                .toUri();
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(MAP_REQUEST_TIMEOUT)
                .header(HttpHeaders.USER_AGENT, USER_AGENT)
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .GET()
                .build();
        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException e) {
            return List.of();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return List.of();
        }
        if (response.statusCode() >= 400) {
            return List.of();
        }

        JsonNode root = objectMapper.readTree(response.body());
        List<MapSearchResultResponse> results = new ArrayList<>();
        for (JsonNode item : root) {
            results.add(toMapResult(item));
        }
        return results;
    }

    @GetMapping("/reverse")
    public ResponseEntity<MapSearchResultResponse> reverse(
            @RequestParam double lat,
            @RequestParam double lon) throws Exception {
        URI uri = UriComponentsBuilder
                .fromUriString("https://nominatim.openstreetmap.org/reverse")
                .queryParam("lat", lat)
                .queryParam("lon", lon)
                .queryParam("format", "jsonv2")
                .queryParam("addressdetails", 1)
                .queryParam("accept-language", "fa,en")
                .queryParam("zoom", 18)
                .build()
                .encode()
                .toUri();
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(MAP_REQUEST_TIMEOUT)
                .header(HttpHeaders.USER_AGENT, USER_AGENT)
                .header(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .GET()
                .build();
        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
        if (response.statusCode() >= 400) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
        return ResponseEntity.ok(toMapResult(objectMapper.readTree(response.body())));
    }

    @GetMapping(value = "/tiles/{z}/{x}/{y}.png", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> tile(@PathVariable int z, @PathVariable int x, @PathVariable int y) throws Exception {
        if (z < 0 || z > 19) {
            return ResponseEntity.badRequest().build();
        }
        URI uri = URI.create("https://tile.openstreetmap.org/%d/%d/%d.png".formatted(z, x, y));
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(MAP_REQUEST_TIMEOUT)
                .header(HttpHeaders.USER_AGENT, USER_AGENT)
                .GET()
                .build();
        HttpResponse<byte[]> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .cacheControl(CacheControl.noStore())
                    .build();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .cacheControl(CacheControl.noStore())
                    .build();
        }
        if (response.statusCode() >= 400) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                .body(response.body());
    }

    private MapSearchResultResponse toMapResult(JsonNode item) {
        JsonNode address = item.path("address");
        String road = firstText(address, "road", "pedestrian", "footway", "residential", "path", "neighbourhood", "suburb");
        String houseNumber = firstText(address, "house_number");
        String street = joinNonBlank(" ", houseNumber, road);
        String city = firstText(address, "city", "town", "village", "municipality", "county", "state", "province");
        String postalCode = firstText(address, "postcode");
        String country = firstText(address, "country");

        return new MapSearchResultResponse(
                item.path("display_name").asText(),
                item.path("lat").asDouble(),
                item.path("lon").asDouble(),
                street,
                city,
                postalCode,
                country);
    }

    private String firstText(JsonNode node, String... keys) {
        for (String key : keys) {
            String value = node.path(key).asText("");
            if (!value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private String joinNonBlank(String separator, String... parts) {
        List<String> values = new ArrayList<>();
        for (String part : parts) {
            if (part != null && !part.isBlank()) {
                values.add(part);
            }
        }
        return String.join(separator, values);
    }
}
