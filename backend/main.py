"""FastAPI application entry point."""

from contextlib import asynccontextmanager
from typing import Any, AsyncGenerator

from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlmodel import Session, text

from config import get_settings
from database import create_db_and_tables, get_session
from rate_limiter import limiter, rate_limit_exceeded_handler
from routes.tasks import router as tasks_router


# Structured error response format
def create_error_response(
    status_code: int,
    code: str,
    message: str,
    details: Any | None = None,
) -> JSONResponse:
    """Create a structured JSON error response.

    Args:
        status_code: HTTP status code.
        code: Application-specific error code.
        message: Human-readable error message.
        details: Additional error details (optional).

    Returns:
        JSONResponse: Structured error response.
    """
    content = {
        "error": {
            "code": code,
            "message": message,
        }
    }
    if details is not None:
        content["error"]["details"] = details
    return JSONResponse(status_code=status_code, content=content)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler for startup/shutdown events."""
    # Startup: Create database tables
    create_db_and_tables()
    yield
    # Shutdown: Cleanup if needed


app = FastAPI(
    title="DoNext API",
    description="Task management API with multi-user support",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

# GZip compression middleware (for responses > 500 bytes)
app.add_middleware(GZipMiddleware, minimum_size=500)

# CORS middleware configuration
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

# Include routers
app.include_router(tasks_router)


# Exception handlers for structured error responses
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions with structured response format."""
    # Extract error details from HTTPException
    if isinstance(exc.detail, dict):
        code = exc.detail.get("code", "HTTP_ERROR")
        message = exc.detail.get("message", str(exc.detail))
    else:
        code = f"HTTP_{exc.status_code}"
        message = str(exc.detail) if exc.detail else "An error occurred"

    return create_error_response(
        status_code=exc.status_code,
        code=code,
        message=message,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle validation errors with structured response format."""
    errors = []
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error.get("loc", []))
        errors.append({
            "field": field,
            "message": error.get("msg", "Validation error"),
            "type": error.get("type", "value_error"),
        })

    return create_error_response(
        status_code=422,
        code="VALIDATION_ERROR",
        message="Request validation failed",
        details=errors,
    )


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions with structured response format."""
    # Log the exception for debugging (in production, use proper logging)
    import logging
    logging.exception("Unexpected error occurred")

    return create_error_response(
        status_code=500,
        code="INTERNAL_SERVER_ERROR",
        message="An unexpected error occurred. Please try again later.",
    )


@app.get("/health", tags=["Health"])
async def health_check() -> dict[str, str]:
    """Liveness check endpoint.

    Returns:
        dict: Status message indicating the service is running.
    """
    return {"status": "healthy"}


@app.get("/ready", tags=["Health"])
async def readiness_check(session: Session = Depends(get_session)) -> dict[str, str]:
    """Readiness check endpoint with database connectivity test.

    Args:
        session: Database session from dependency injection.

    Returns:
        dict: Status message indicating the service is ready to accept requests.

    Raises:
        HTTPException: If database connection fails.
    """
    # Test database connection
    session.exec(text("SELECT 1"))
    return {"status": "ready", "database": "connected"}
