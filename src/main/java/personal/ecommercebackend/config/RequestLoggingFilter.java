package personal.ecommercebackend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Slf4j
@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        long start = System.currentTimeMillis();
        String method = request.getMethod();
        String uri = request.getRequestURI();
        String query = request.getQueryString();
        String fullPath = query == null ? uri : uri + "?" + query;
        String requestId = resolveRequestId(request);
        MDC.put("requestId", requestId);
        response.setHeader("X-Request-Id", requestId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = System.currentTimeMillis() - start;
            int status = response.getStatus();
            String user = resolveUser();

            if (shouldLog(uri, status)) {
                log.info("HTTP {} {} -> {} ({} ms) user={}",
                        method, fullPath, status, durationMs, user);
            }
            MDC.remove("requestId");
        }
    }

    private static String resolveRequestId(HttpServletRequest request) {
        String supplied = request.getHeader("X-Request-Id");
        if (supplied == null || supplied.isBlank()) {
            return UUID.randomUUID().toString();
        }
        return supplied.length() > 80 ? supplied.substring(0, 80) : supplied;
    }

    private static boolean shouldLog(String uri, int status) {
        if (uri.startsWith("/actuator") || uri.startsWith("/swagger-ui")
                || uri.startsWith("/v3/api-docs") || uri.contains("/favicon")) {
            return false;
        }
        return status >= 400 || !uri.startsWith("/uploads");
    }

    private static String resolveUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return "anonymous";
        }
        return auth.getName();
    }
}
