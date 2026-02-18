# Gate - URL Shortener

A full-stack URL shortener built with **Spring Boot** and **React**, featuring in-memory caching for sub-millisecond redirects, sliding-window rate limiting, async click analytics, and JWT authentication — containerized for one-command startup.

## Key Engineering Decisions

### Caffeine Cache on the Redirect Hot Path

URL shorteners are read-heavy (~1000:1 read:write ratio). The redirect endpoint uses a **cache-aside pattern** with Caffeine (W-TinyLFU eviction, 10k entries, 10-minute TTL) to serve cached redirects in **<1ms** without hitting the database. Cache hit/miss ratios are logged on a scheduled interval for observability.

### Async Analytics with `@Async`

Click tracking (incrementing counts + inserting click events) runs on a **separate thread** via `@Async`, so the 302 redirect response is never blocked by database writes. The user gets redirected instantly; analytics are recorded in the background.

### Sliding-Window Rate Limiting

Custom rate limiter using `ConcurrentHashMap` with per-key timestamp deques — **100 requests/min per IP** on redirects, **10 URL creations/hour per user**. Stale entries are cleaned up on a scheduled task to prevent memory leaks. No external dependencies (no Redis, no Bucket4j).

### Environment-Driven Configuration

All secrets and connection strings are externalized via `${ENV_VAR:default}` in `application.properties`. Local development works with zero config; Docker Compose injects production values. No hardcoded secrets in source.

## Features

- **Authentication** — Register/login with JWT tokens (BCrypt hashing, 48h expiry)
- **URL Shortening** — Cryptographically random 8-char codes via `SecureRandom`, collision-resistant with retry logic
- **Analytics Dashboard** — Per-URL click tracking with date-range filtering (7d/30d/90d), visualized with Recharts bar charts
- **Aggregated Analytics** — Total clicks across all URLs by date range
- **Caching** — Caffeine in-memory cache for redirect lookups with hit/miss logging
- **Rate Limiting** — Sliding-window algorithm, per-IP and per-user limits
- **SSR** — Server-side rendered React frontend for fast initial loads
- **Dockerized** — Full-stack `docker compose up` with MySQL + backend + frontend

## Tech Stack

| Layer    | Technology                                                 |
| -------- | ---------------------------------------------------------- |
| Backend  | Java 21, Spring Boot 4, Spring Security, Spring Data JPA   |
| Auth     | JWT (jjwt), BCrypt                                         |
| Cache    | Caffeine (W-TinyLFU eviction)                              |
| Database | MySQL 8.0                                                  |
| Frontend | React 19, React Router 7 (SSR), TypeScript, Tailwind CSS 4 |
| Charts   | Recharts                                                   |
| Build    | Maven, Vite 7, Bun                                         |
| Infra    | Docker Compose (3 services), multi-stage Dockerfiles       |

## Quick Start

```bash
git clone https://github.com/mdtalim/gate.git
cd gate
docker compose up --build
```

Wait ~30s for MySQL and backend to initialize, then:

```bash
# Register
curl -s -X POST http://localhost:8080/api/auth/public/register \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","email":"demo@test.com","password":"password123"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/public/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"password123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Shorten a URL
curl -s -X POST http://localhost:8080/api/urls/shorten \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"originalUrl":"https://github.com/mdtalim"}'

# Test the redirect (replace SHORT_CODE)
curl -v http://localhost:8080/SHORT_CODE

# Open the dashboard
open http://localhost:3000
```

## API Endpoints

| Method | Path                             | Auth     | Description                |
| ------ | -------------------------------- | -------- | -------------------------- |
| POST   | `/api/auth/public/register`      | Public   | Register a new account     |
| POST   | `/api/auth/public/login`         | Public   | Login and receive JWT      |
| POST   | `/api/urls/shorten`              | Required | Shorten a URL              |
| GET    | `/api/urls/myurls`               | Required | List user's URLs           |
| GET    | `/api/urls/analytics/{shortUrl}` | Required | Per-URL daily click counts |
| GET    | `/api/urls/totalClicks`          | Required | Aggregated clicks by date  |
| GET    | `/{shortUrl}`                    | Public   | Redirect (cached)          |

## Data Model

```
User (1) ──── (*) UrlMapping (1) ──── (*) ClickEvent
  │                   │                       │
  ├─ id               ├─ id                   ├─ id
  ├─ username         ├─ originalUrl          ├─ clickDate
  ├─ email            ├─ shortUrl             └─ urlMapping (FK)
  ├─ password         ├─ clickCount
  └─ role             ├─ createdDate
                      └─ user (FK)
```

## Local Development (without Docker)

```bash
# Start MySQL
docker compose up mysql -d

# Backend
cd backend && ./mvnw spring-boot:run

# Frontend
cd frontend && bun install && bun run dev
```

## Roadmap

- [ ] Custom aliases for shortened URLs
- [ ] Allow generating short URLs without requiring an account
- [ ] Batch click event writes for higher throughput
- [ ] Integration tests for URL shortening, redirect + cache, and rate limiting

---

Built with ☕, ⚛️, and too many 302s.
