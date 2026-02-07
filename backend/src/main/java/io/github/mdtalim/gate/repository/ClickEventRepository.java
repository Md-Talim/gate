package io.github.mdtalim.gate.repository;

import io.github.mdtalim.gate.models.ClickEvent;
import io.github.mdtalim.gate.models.UrlMapping;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ClickEventRepository extends JpaRepository<ClickEvent, Long> {
    List<ClickEvent> findByUrlMappingAndClickDateBetween(UrlMapping mapping, LocalDateTime start, LocalDateTime end);

    List<ClickEvent> findByUrlMappingInAndClickDateBetween(List<UrlMapping> mappings, LocalDateTime start, LocalDateTime end);
}
