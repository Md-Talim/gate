package io.github.mdtalim.gate.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    // --- Rate limit configuration ---
    // Authenticated URL creation: 10 requests per 60 minutes
    private static final int URL_CREATION_LIMIT = 10;
    private static final int URL_CREATION_WINDOW_MINUTES = 60;

    // Public redirects: 100 requests per 1 minute (per IP)
    private static final int REDIRECT_LIMIT = 100;
    private static final int REDIRECT_WINDOW_MINUTES = 1;

    @Autowired
    private RateLimiter rateLimiter;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        if ("POST".equalsIgnoreCase(method) && "/api/urls/shorten".equals(path)) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();

            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                String username = auth.getName();
                String key = "shorten:" + username;

                if (!rateLimiter.isAllowed(key, URL_CREATION_LIMIT, URL_CREATION_WINDOW_MINUTES)) {
                    String message = String.format("URL creation rate limit exceeded. Max %d URLs per hour.", URL_CREATION_LIMIT);
                    writeRateLimitResponse(response, message);
                    return;
                }
            }
        }

        if ("GET".equalsIgnoreCase(method) && !path.startsWith("/api/") && path.matches("^/[a-zA-Z0-9]+$")) {
            String clientIp = getClientIp(request);
            String key = "redirect:" + clientIp;

            if (!rateLimiter.isAllowed(key, REDIRECT_LIMIT, REDIRECT_WINDOW_MINUTES)) {
                writeRateLimitResponse(response, "Redirect rate limit exceeded. Try again shortly.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void writeRateLimitResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType("application/json");

        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
        body.put("error", "Too Many Requests");
        body.put("message", message);

        objectMapper.writeValue(response.getWriter(), body);
    }
}
