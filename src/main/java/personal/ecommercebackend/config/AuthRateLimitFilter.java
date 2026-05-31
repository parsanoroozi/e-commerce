package personal.ecommercebackend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Clock;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Window> windows = new ConcurrentHashMap<>();
    private final Clock clock = Clock.systemUTC();
    private final AtomicLong limitedRequests = new AtomicLong();

    @Value("${app.rate-limit.auth.max-requests:20}")
    private int maxRequests;

    @Value("${app.rate-limit.auth.window-ms:900000}")
    private long windowMs;

    @Value("${app.rate-limit.auth.max-windows:10000}")
    private int maxWindows;

    @Value("${app.proxy.trust-forwarded-headers:false}")
    private boolean trustForwardedHeaders;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        if (!isLimitedEndpoint(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = clientIp(request) + ":" + request.getRequestURI();
        long now = clock.millis();
        if (limitedRequests.incrementAndGet() % 100 == 0 || windows.size() > maxWindows) {
            cleanupExpiredWindows(now);
        }
        if (windows.size() >= maxWindows && !windows.containsKey(key)) {
            response.sendError(429, "Too many authentication attempts. Try again later.");
            return;
        }
        Window window = windows.compute(key, (ignored, existing) -> {
            if (existing == null || now >= existing.resetAt) {
                return new Window(1, now + windowMs);
            }
            existing.count++;
            return existing;
        });

        response.setHeader("X-RateLimit-Limit", String.valueOf(maxRequests));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, maxRequests - window.count)));
        response.setHeader("X-RateLimit-Reset", String.valueOf(window.resetAt));

        if (window.count > maxRequests) {
            response.sendError(429, "Too many authentication attempts. Try again later.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isLimitedEndpoint(HttpServletRequest request) {
        if (!"POST".equalsIgnoreCase(request.getMethod())) {
            return false;
        }
        String uri = request.getRequestURI();
        return uri.equals("/api/auth/login")
                || uri.equals("/api/auth/register")
                || uri.equals("/api/auth/forgot-password")
                || uri.equals("/api/auth/reset-password");
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = trustForwardedHeaders ? request.getHeader("X-Forwarded-For") : null;
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void cleanupExpiredWindows(long now) {
        windows.entrySet().removeIf(entry -> now >= entry.getValue().resetAt);
    }

    private static class Window {
        private int count;
        private final long resetAt;

        private Window(int count, long resetAt) {
            this.count = count;
            this.resetAt = resetAt;
        }
    }
}
