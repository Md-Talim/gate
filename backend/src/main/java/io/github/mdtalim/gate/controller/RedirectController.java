package io.github.mdtalim.gate.controller;

import io.github.mdtalim.gate.models.UrlMapping;
import io.github.mdtalim.gate.service.UrlMappingService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@AllArgsConstructor
public class RedirectController {
    private UrlMappingService urlMappingService;

    @GetMapping("/{shortUrl}")
    public ResponseEntity<Void> redirect(@PathVariable String shortUrl) {
        UrlMapping urlMapping = urlMappingService.getOriginalUrl(shortUrl);

        urlMappingService.updateClickAnalytics(urlMapping);

        return ResponseEntity.status(HttpStatus.FOUND)
                .header("Location", urlMapping.getOriginalUrl())
                .build();
    }
}
