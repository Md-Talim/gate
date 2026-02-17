package io.github.mdtalim.gate.security;

import java.time.LocalDateTime;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class RateLimiter {
    // key = client identifier (IP or username), value = timestamps of request
    private final Map<String, Deque<LocalDateTime>> requestLog = new ConcurrentHashMap<>();

    /**
     * Check if a request is allowed under the rate limit
     *
     * @param key           the client identifier (e.g., IP address or username)
     * @param maxRequests   maximum number of requests allowed in the window
     * @param windowMinutes the time window in minutes
     * @return true if the request is allowed, false if rate-limited
     */
    public boolean isAllowed(String key, int maxRequests, int windowMinutes) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime windowStart = now.minusMinutes(windowMinutes);

        Deque<LocalDateTime> timestamps = requestLog.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());

        // Remove timestamps outside the window
        while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(windowStart)) {
            timestamps.pollFirst();
        }

        if (timestamps.size() >= maxRequests) {
            return false;
        }

        timestamps.addLast(now);
        return true;
    }

    /**
     * Cleanup stale entries every 10 minutes to prevent memory leaks
     * from clients that made requests once and never came back.
     */
    @Scheduled(fixedRate = 600_000)
    public void cleanup() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(2);
        requestLog.entrySet().removeIf(entry -> {
            var timestamps = entry.getValue();
            return timestamps.isEmpty() || timestamps.peekLast().isBefore(cutoff);
        });
    }
}
