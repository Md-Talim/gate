package io.github.mdtalim.gate.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.stats.CacheStats;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@Service
public class UrlCacheService {

    private Cache<String, String> urlCache; // shortUrl -> originalUrl

    @PostConstruct
    public void init() {
        urlCache = Caffeine.newBuilder()
                .maximumSize(10000)
                .expireAfterWrite(Duration.ofMinutes(10))
                .recordStats()
                .build();
        log.info("URL cache initialized: maxSize=10000, TTL=10min");
    }

    /**
     * Get from cache, returns null on miss.
     */
    public String get(String shortUrl) {
        String originalUrl = urlCache.getIfPresent(shortUrl);
        if (originalUrl != null) {
            log.debug("Cache HIT for shortUrl={}", shortUrl);
        } else {
            log.debug("Cache MISS for shortUrl={}", shortUrl);
        }
        return originalUrl;
    }

    /**
     * Put into cache after a DB lookup.
     */
    public void put(String shortUrl, String originalUrl) {
        urlCache.put(shortUrl, originalUrl);
    }

    /**
     * Evict a specific entry (useful if a URL is deleted/updated).
     */
    public void evict(String shortUrl) {
        urlCache.invalidate(shortUrl);
        log.debug("Cache EVICT for shortUrl={}", shortUrl);
    }

    /**
     * Log cache hit/miss ratio every 5 minutes.
     */
    @Scheduled(fixedRate = 300_000) // 5 minutes
    public void logCacheStats() {
        CacheStats stats = urlCache.stats();
        log.info(
                "URL Cache Stats - hitRate={}, hits={}, misses={}, evictions={}",
                String.format("%.2f%%", stats.hitRate() * 100),
                stats.hitCount(), stats.missCount(),
                stats.evictionCount()
        );
    }
}
