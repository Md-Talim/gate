# Gate - URL Shortener

A full-stack URL shortening service that transforms long URLs into short, shareable links with built-in click analytics and user authentication.

## About

Gate is a URL shortener that lets authenticated users create shortened URLs, track click counts, and view analytics on their links. Each shortened URL is an 8-character alphanumeric code that redirects visitors to the original destination while recording click events for analytics.

The application features JWT-based authentication, a dashboard for managing all your shortened URLs, and per-URL click tracking with date-range filtering.

## Why I Built This

I built Gate as a learning project to deepen my understanding of system design and backend development in Java. It covers real-world concerns like authentication flows, database modeling with relational data (users, URL mappings, click events), RESTful API design, and connecting a modern frontend to a Spring Boot backend. It was a good exercise in thinking through how a seemingly simple product involves meaningful architectural decisions around security, data modeling, and API structure.

## Features

- User registration and login with JWT-based authentication
- Shorten long URLs into compact 8-character links
- Dashboard to view and manage all your shortened URLs
- Click tracking with per-URL analytics and date-range filtering
- Aggregated click analytics across all URLs
- Copy-to-clipboard for shortened links
- Server-side rendering for fast initial page loads
- Dockerized MySQL database for local development

## Tech Stack

### Backend

- **Java 21** with **Spring Boot 4**
- **Spring Security** with JWT (jjwt) for authentication and authorization
- **Spring Data JPA** for ORM and database access
- **MySQL 8.0** as the primary database (considering migration to PostgreSQL for easier hosting)
- **Maven** for build and dependency management
- **Lombok** for reducing boilerplate

### Frontend

- **React 19** with **TypeScript**
- **React Router v7** in framework mode (SSR enabled)
- **Tailwind CSS v4** for styling
- **Vite 7** as the build tool

### Infrastructure

- **Docker Compose** for running MySQL locally

## API Endpoints

### Authentication

| Method | Path                        | Auth   | Description                          |
| ------ | --------------------------- | ------ | ------------------------------------ |
| POST   | `/api/auth/public/login`    | Public | Authenticate and receive a JWT token |
| POST   | `/api/auth/public/register` | Public | Register a new user account          |

### URL Management

| Method | Path                             | Auth     | Description                                 |
| ------ | -------------------------------- | -------- | ------------------------------------------- |
| POST   | `/api/urls/shorten`              | Required | Create a shortened URL                      |
| GET    | `/api/urls/myurls`               | Required | List all URLs for the authenticated user    |
| GET    | `/api/urls/analytics/{shortUrl}` | Required | Get daily click counts for a specific URL   |
| GET    | `/api/urls/totalClicks`          | Required | Get aggregated daily clicks across all URLs |

### Redirect

| Method | Path          | Auth   | Description                  |
| ------ | ------------- | ------ | ---------------------------- |
| GET    | `/{shortUrl}` | Public | Redirect to the original URL |

## Data Model

- **User** -- stores account credentials and role
- **UrlMapping** -- maps a short code to an original URL, tracks total click count, belongs to a user
- **ClickEvent** -- records individual click timestamps for a URL mapping, used for analytics

## Getting Started

### Prerequisites

- Java 21
- Node.js and Bun (or npm)
- Docker and Docker Compose

### Run the Database

```bash
docker compose up -d
```

### Run the Backend

```bash
cd backend
./mvnw spring-boot:run
```

The backend runs on `http://localhost:8080`.

### Run the Frontend

```bash
cd frontend
bun install
bun run dev
```

The frontend runs on `http://localhost:5173`.

## Roadmap

- Per-URL analytics dashboard with click graphs
- Custom aliases for shortened URLs
- Redis caching for faster redirects
- Allow generating short URLs without requiring an account

---

Built with ☕ and ⚛️
