package personal.ecommercebackend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;
import personal.ecommercebackend.dto.response.MapSearchResultResponse;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/maps")
public class MapController {

    private static final String USER_AGENT = "ShopVerse/1.0 (local development)";
    private static final Duration MAP_CONNECT_TIMEOUT = Duration.ofSeconds(8);
    private static final Duration MAP_REQUEST_TIMEOUT = Duration.ofSeconds(20);
    private static final int SEARCH_LIMIT = 10;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(MAP_CONNECT_TIMEOUT)
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    @Value("${app.maps.geoapify-key:}")
    private String geoapifyKey;

    @GetMapping("/search")
    public List<MapSearchResultResponse> search(@RequestParam String q) throws Exception {
        List<MapSearchResultResponse> geoapifyResults = searchGeoapify(q);
        if (!geoapifyResults.isEmpty()) {
            return geoapifyResults;
        }

        List<MapSearchResultResponse> photonResults = searchPhoton(q);
        if (!photonResults.isEmpty()) {
            return photonResults;
        }

        return searchNominatim(q);
    }

    @GetMapping("/reverse")
    public ResponseEntity<MapSearchResultResponse> reverse(
            @RequestParam double lat,
            @RequestParam double lon) throws Exception {
        MapSearchResultResponse geoapifyResult = reverseGeoapify(lat, lon);
        if (geoapifyResult != null) {
            return ResponseEntity.ok(geoapifyResult);
        }

        MapSearchResultResponse nominatimResult = reverseNominatim(lat, lon);
        if (nominatimResult != null) {
            return ResponseEntity.ok(nominatimResult);
        }

        MapSearchResultResponse photonResult = reversePhoton(lat, lon);
        if (photonResult != null) {
            return ResponseEntity.ok(photonResult);
        }

        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
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

    private List<MapSearchResultResponse> searchGeoapify(String q) throws Exception {
        if (geoapifyKey == null || geoapifyKey.isBlank()) {
            return List.of();
        }
        URI uri = UriComponentsBuilder
                .fromUriString("https://api.geoapify.com/v1/geocode/search")
                .queryParam("text", q)
                .queryParam("format", "json")
                .queryParam("lang", "fa")
                .queryParam("limit", SEARCH_LIMIT)
                .queryParam("apiKey", geoapifyKey)
                .build()
                .encode()
                .toUri();
        JsonNode root = sendJson(uri);
        if (root == null) {
            return List.of();
        }
        List<MapSearchResultResponse> results = new ArrayList<>();
        for (JsonNode item : root.path("results")) {
            results.add(toGeoapifyResult(item));
        }
        return results;
    }

    private List<MapSearchResultResponse> searchPhoton(String q) throws Exception {
        URI uri = UriComponentsBuilder
                .fromUriString("https://photon.komoot.io/api/")
                .queryParam("q", q)
                .queryParam("lang", "fa")
                .queryParam("limit", SEARCH_LIMIT)
                .build()
                .encode()
                .toUri();
        JsonNode root = sendJson(uri);
        if (root == null) {
            return List.of();
        }
        List<MapSearchResultResponse> results = new ArrayList<>();
        for (JsonNode feature : root.path("features")) {
            results.add(toPhotonResult(feature));
        }
        results.sort(Comparator.comparing((MapSearchResultResponse result) -> isBlank(result.street()))
                .thenComparing(result -> isBlank(result.city()))
                .thenComparing(result -> isBlank(result.postalCode())));
        return results;
    }

    private List<MapSearchResultResponse> searchNominatim(String q) throws Exception {
        URI uri = UriComponentsBuilder
                .fromUriString("https://nominatim.openstreetmap.org/search")
                .queryParam("q", q)
                .queryParam("format", "jsonv2")
                .queryParam("addressdetails", 1)
                .queryParam("accept-language", "fa,en")
                .queryParam("namedetails", 1)
                .queryParam("limit", SEARCH_LIMIT)
                .build()
                .encode()
                .toUri();
        JsonNode root = sendJson(uri);
        if (root == null) {
            return List.of();
        }
        List<MapSearchResultResponse> results = new ArrayList<>();
        for (JsonNode item : root) {
            results.add(toNominatimResult(item));
        }
        return results;
    }

    private MapSearchResultResponse reverseGeoapify(double lat, double lon) throws Exception {
        if (geoapifyKey == null || geoapifyKey.isBlank()) {
            return null;
        }
        URI uri = UriComponentsBuilder
                .fromUriString("https://api.geoapify.com/v1/geocode/reverse")
                .queryParam("lat", lat)
                .queryParam("lon", lon)
                .queryParam("format", "json")
                .queryParam("lang", "fa")
                .queryParam("apiKey", geoapifyKey)
                .build()
                .encode()
                .toUri();
        JsonNode root = sendJson(uri);
        JsonNode first = root == null ? null : root.path("results").path(0);
        return first == null || first.isMissingNode() ? null : toGeoapifyResult(first);
    }

    private MapSearchResultResponse reverseNominatim(double lat, double lon) throws Exception {
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
        JsonNode root = sendJson(uri);
        return root == null ? null : toNominatimResult(root);
    }

    private MapSearchResultResponse reversePhoton(double lat, double lon) throws Exception {
        URI uri = UriComponentsBuilder
                .fromUriString("https://photon.komoot.io/reverse")
                .queryParam("lat", lat)
                .queryParam("lon", lon)
                .queryParam("lang", "fa")
                .build()
                .encode()
                .toUri();
        JsonNode root = sendJson(uri);
        JsonNode first = root == null ? null : root.path("features").path(0);
        return first == null || first.isMissingNode() ? null : toPhotonResult(first);
    }

    private JsonNode sendJson(URI uri) throws Exception {
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
            return null;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return null;
        }
        if (response.statusCode() >= 400) {
            return null;
        }
        return objectMapper.readTree(response.body());
    }

    private MapSearchResultResponse toNominatimResult(JsonNode item) {
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

    private MapSearchResultResponse toPhotonResult(JsonNode feature) {
        JsonNode properties = feature.path("properties");
        JsonNode coordinates = feature.path("geometry").path("coordinates");
        String street = joinNonBlank(" ",
                firstText(properties, "housenumber"),
                firstText(properties, "street", "name"));
        String city = firstText(properties, "city", "district", "county", "state");
        String postalCode = firstText(properties, "postcode");
        String country = firstText(properties, "country");
        String displayName = joinNonBlank(", ",
                firstText(properties, "name"),
                street,
                city,
                postalCode,
                country);

        return new MapSearchResultResponse(
                displayName,
                coordinates.path(1).asDouble(),
                coordinates.path(0).asDouble(),
                street,
                city,
                postalCode,
                country);
    }

    private MapSearchResultResponse toGeoapifyResult(JsonNode item) {
        String street = joinNonBlank(" ",
                firstText(item, "housenumber", "house_number"),
                firstText(item, "street", "address_line1", "name"));
        String city = firstText(item, "city", "town", "village", "municipality", "county", "state");
        String postalCode = firstText(item, "postcode");
        String country = firstText(item, "country");

        return new MapSearchResultResponse(
                firstText(item, "formatted", "address_line2", "name"),
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

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
