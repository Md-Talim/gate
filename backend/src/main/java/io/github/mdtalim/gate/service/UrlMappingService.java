package io.github.mdtalim.gate.service;

import io.github.mdtalim.gate.dtos.ClickEventDTO;
import io.github.mdtalim.gate.dtos.UrlMappingDTO;
import io.github.mdtalim.gate.exception.ResourceNotFoundException;
import io.github.mdtalim.gate.models.ClickEvent;
import io.github.mdtalim.gate.models.UrlMapping;
import io.github.mdtalim.gate.models.User;
import io.github.mdtalim.gate.repository.ClickEventRepository;
import io.github.mdtalim.gate.repository.UrlMappingRepository;
import lombok.AllArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class UrlMappingService {

    private static final String CHARACTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int SHORT_URL_LENGTH = 8;
    private static final int MAX_RETRIES = 5;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private UrlMappingRepository urlMappingRepository;
    private ClickEventRepository clickEventRepository;
    private UrlCacheService urlCacheService;

    @Transactional
    public UrlMappingDTO createShortUrl(String originalUrl, User user) {
        String shortUrl = generateUniqueShortUrl();

        UrlMapping urlMapping = new UrlMapping();
        urlMapping.setOriginalUrl(originalUrl);
        urlMapping.setShortUrl(shortUrl);
        urlMapping.setUser(user);
        urlMapping.setCreatedDate(LocalDateTime.now());

        UrlMapping savedUrlMapping = urlMappingRepository.save(urlMapping);
        return convertToDTO(savedUrlMapping);
    }

    @Transactional(readOnly = true)
    public List<UrlMappingDTO> getUrlsByUser(User user) {
        return urlMappingRepository.findByUser(user)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClickEventDTO> getClickEventsByDate(String shortUrl, LocalDateTime start, LocalDateTime end, User user) {
        UrlMapping urlMapping = urlMappingRepository.findByShortUrl(shortUrl);
        if (urlMapping == null) {
            throw new ResourceNotFoundException("Short URL not found: " + shortUrl);
        }

        if (!urlMapping.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have permission to view analytics for this URL");
        }

        return clickEventRepository.findByUrlMappingAndClickDateBetween(urlMapping, start, end).stream()
                .collect(Collectors.groupingBy(click -> click.getClickDate().toLocalDate(), Collectors.counting()))
                .entrySet().stream()
                .map(entry -> {
                    ClickEventDTO clickEventDTO = new ClickEventDTO();
                    clickEventDTO.setClickDate(entry.getKey());
                    clickEventDTO.setCount(entry.getValue());
                    return clickEventDTO;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<LocalDate, Long> getTotalClicksByUserAndDate(User user, LocalDate start, LocalDate end) {
        List<UrlMapping> urlMappings = urlMappingRepository.findByUser(user);
        List<ClickEvent> clickEvents = clickEventRepository.findByUrlMappingInAndClickDateBetween(urlMappings, start.atStartOfDay(), end.plusDays(1).atStartOfDay());
        return clickEvents.stream()
                .collect(Collectors.groupingBy(click -> click.getClickDate().toLocalDate(), Collectors.counting()));
    }

    @Transactional(readOnly = true)
    public String resolveOriginalUrl(String shortUrl) {
        String cachedUrl = urlCacheService.get(shortUrl);
        if (cachedUrl != null) {
            return cachedUrl;
        }

        UrlMapping urlMapping = urlMappingRepository.findByShortUrl(shortUrl);
        if (urlMapping == null) {
            throw new ResourceNotFoundException("Short URL not found: " + shortUrl);
        }

        urlCacheService.put(shortUrl, urlMapping.getOriginalUrl());

        return urlMapping.getOriginalUrl();
    }

    @Async
    @Transactional
    public void recordClick(String shortUrl) {
        UrlMapping urlMapping = urlMappingRepository.findByShortUrl(shortUrl);
        if (urlMapping == null) return;

        urlMapping.setClickCount(urlMapping.getClickCount() + 1);
        urlMappingRepository.save(urlMapping);

        ClickEvent clickEvent = new ClickEvent();
        clickEvent.setUrlMapping(urlMapping);
        clickEvent.setClickDate(LocalDateTime.now());
        clickEventRepository.save(clickEvent);
    }

    private String generateUniqueShortUrl() {
        for (int attempt = 0; attempt < MAX_RETRIES; attempt++) {
            String candidate = generateShortUrl();
            if (!urlMappingRepository.existsByShortUrl(candidate)) {
                return candidate;
            }
        }

        throw new RuntimeException("Failed to generate a unique short URL after " + MAX_RETRIES + " attempts");
    }

    private String generateShortUrl() {
        StringBuilder shortUrl = new StringBuilder();
        for (int i = 0; i < SHORT_URL_LENGTH; i++) {
            shortUrl.append(CHARACTERS.charAt(SECURE_RANDOM.nextInt(CHARACTERS.length())));
        }
        return shortUrl.toString();
    }

    private UrlMappingDTO convertToDTO(UrlMapping urlMapping) {
        UrlMappingDTO urlMappingDTO = new UrlMappingDTO();
        urlMappingDTO.setId(urlMapping.getId());
        urlMappingDTO.setOriginalUrl(urlMapping.getOriginalUrl());
        urlMappingDTO.setShortUrl(urlMapping.getShortUrl());
        urlMappingDTO.setClickCount(urlMapping.getClickCount());
        urlMappingDTO.setCreatedDate(urlMapping.getCreatedDate());
        urlMappingDTO.setUsername(urlMapping.getUser().getUsername());
        return urlMappingDTO;
    }
}
