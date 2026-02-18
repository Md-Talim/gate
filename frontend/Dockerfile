# ---- Stage 1: Install all deps ----
FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --fronzen-lockfile

# ---- Stage 2: Build ----
FROM oven/bun:1-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Vite bakes env vars at build time, so we pass it here
ARG VITE_BACKEND_API_URL=http://localhost:8080
ENV VITE_BACKEND_API_URL=${VITE_BACKEND_API_URL}

RUN bun run build

# ---- Stage 3: Production ----
FROM node:20-alpine
WORKDIR /app
COPY package.json bun.lock ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build

EXPOSE 3000
CMD [ "npx", "react-router-serve", "./build/server/index.js" ]
