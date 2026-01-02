---
name: dockerfile-generator
description: Generate multi-stage Dockerfiles for Next.js frontend and FastAPI backend with security best practices
---

# Dockerfile Generator Skill

## Purpose
Create production-ready, secure, optimized Dockerfiles for containerizing applications in Phase IV.

## Core Principles
1. **Multi-stage builds** - Separate build and runtime stages
2. **Minimal base images** - Use Alpine or slim variants
3. **Non-root users** - Never run as root in production
4. **Layer optimization** - Order commands by change frequency
5. **Health checks** - Enable container orchestration monitoring

## When to Use
- Phase IV: Containerizing for Kubernetes
- Creating Docker images for deployment
- Optimizing build times and image sizes
- Setting up local development with Docker Compose

## Backend Dockerfile (FastAPI)
```dockerfile
# backend/Dockerfile
# Multi-stage build for Python FastAPI application

# ==================== Stage 1: Builder ====================
FROM python:3.13-slim AS builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install UV package manager
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files
COPY requirements.txt .

# Install Python dependencies to /app/.venv
RUN uv pip install --system --no-cache -r requirements.txt

# ==================== Stage 2: Runtime ====================
FROM python:3.13-slim

# Set working directory
WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy installed dependencies from builder
COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')" || exit 1

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Frontend Dockerfile (Next.js)
```dockerfile
# frontend/Dockerfile
# Multi-stage build for Next.js application

# ==================== Stage 1: Dependencies ====================
FROM node:20-alpine AS deps

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# ==================== Stage 2: Builder ====================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build Next.js application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ==================== Stage 3: Runner ====================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Start application
CMD ["node", "server.js"]
```

## .dockerignore (Backend)
```
# backend/.dockerignore
# Exclude from Docker context

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt
.pytest_cache/
.coverage
htmlcov/

# IDEs
.vscode/
.idea/
*.swp
*.swo

# Git
.git/
.gitignore

# Environment
.env
.env.local
.env.*.local

# Misc
*.log
.DS_Store
```

## .dockerignore (Frontend)
```
# frontend/.dockerignore
# Exclude from Docker context

# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Next.js
.next/
out/

# Testing
coverage/

# Environment
.env
.env*.local

# IDEs
.vscode/
.idea/
*.swp

# Git
.git/
.gitignore

# Misc
.DS_Store
*.log
```

## Docker Compose (Local Development)
```yaml
# docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:16-alpine
    container_name: todo-db
    environment:
      POSTGRES_USER: todouser
      POSTGRES_PASSWORD: todopass
      POSTGRES_DB: tododb
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U todouser"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend (FastAPI)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: todo-backend
    environment:
      DATABASE_URL: postgresql://todouser:todopass@postgres:5432/tododb
      BETTER_AUTH_SECRET: your-secret-key-here
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app  # Hot reload in dev
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  # Frontend (Next.js)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      target: builder  # Use builder stage for dev
    container_name: todo-frontend
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    ports:
      - "3000:3000"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app  # Hot reload in dev
      - /app/node_modules  # Don't override node_modules
    command: npm run dev

volumes:
  postgres_data:
```

## Production Docker Compose
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: ghcr.io/yourusername/todo-backend:latest
    restart: always
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      BETTER_AUTH_SECRET: ${BETTER_AUTH_SECRET}
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    image: ghcr.io/yourusername/todo-frontend:latest
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: https://api.yourdomain.com
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## Building and Running

### Development
```bash
# Build images
docker-compose build

# Start services
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend
```

### Production
```bash
# Build and tag images
docker build -t todo-backend:latest ./backend
docker build -t todo-frontend:latest ./frontend

# Tag for registry
docker tag todo-backend:latest ghcr.io/yourusername/todo-backend:latest
docker tag todo-frontend:latest ghcr.io/yourusername/todo-frontend:latest

# Push to registry
docker push ghcr.io/yourusername/todo-backend:latest
docker push ghcr.io/yourusername/todo-frontend:latest

# Run with production compose
docker-compose -f docker-compose.prod.yml up -d
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Running as root | Create and use non-root user |
| Copying node_modules | Add to .dockerignore |
| No health checks | Add HEALTHCHECK instruction |
| Large images (>1GB) | Use alpine/slim, multi-stage builds |
| Hardcoded secrets | Use environment variables |
| No layer caching | Copy package files before source code |

## Usage Instructions

### Generate Backend Dockerfile
@.claude/skills/dockerfile-generator/Skill.md
Generate production Dockerfile for FastAPI backend.
Requirements:

Python 3.13-slim base image
UV for dependency management
Multi-stage build (builder + runtime)
Non-root user
Health check on /health endpoint
Port 8000

Save to: backend/Dockerfile

### Generate Frontend Dockerfile
@.claude/skills/dockerfile-generator/Skill.md
Generate production Dockerfile for Next.js 15 frontend.
Requirements:

Node 20-alpine base image
Multi-stage build (deps + builder + runner)
Non-root user
Next.js standalone output
Health check on /api/health
Port 3000

Save to: frontend/Dockerfile
