# backend/Dockerfile
# Multi-stage build for Python FastAPI application

# ==================== Stage 1: Builder ====================
FROM python:3.13-slim AS builder

WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY requirements.txt .

# Install Python dependencies (production only)
RUN pip install --no-cache-dir --prefix=/install \
    $(grep -v '^\s*#' requirements.txt | grep -v '^\s*$' | grep -v 'pytest' | grep -v 'httpx' | grep -v 'ruff' | grep -v 'pytest-asyncio' | grep -v 'pytest-cov')

# ==================== Stage 2: Runtime ====================
FROM python:3.13-slim

WORKDIR /app

# Install runtime dependency for psycopg2
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy installed dependencies from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY --chown=appuser:appuser . .

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
