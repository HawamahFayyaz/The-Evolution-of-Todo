"""Rate limiting configuration using slowapi.

Prevents brute force attacks on authentication endpoints and
protects API from abuse.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse


def get_client_ip(request: Request) -> str:
    """Get client IP address, handling proxies.

    Checks X-Forwarded-For header first (for reverse proxies),
    falls back to direct client address.

    Args:
        request: FastAPI request object.

    Returns:
        str: Client IP address.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # X-Forwarded-For can contain multiple IPs, take the first (client)
        return forwarded.split(",")[0].strip()
    return get_remote_address(request)


# Create limiter instance with IP-based limiting
limiter = Limiter(key_func=get_client_ip)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Custom handler for rate limit exceeded errors.

    Returns a structured JSON error response consistent with the API.

    Args:
        request: FastAPI request object.
        exc: Rate limit exceeded exception.

    Returns:
        JSONResponse: 429 Too Many Requests response.
    """
    return JSONResponse(
        status_code=429,
        content={
            "error": {
                "code": "RATE_LIMIT_EXCEEDED",
                "message": f"Too many requests. Please try again later.",
                "details": {
                    "limit": str(exc.detail),
                    "retry_after": request.headers.get("Retry-After", "60"),
                },
            }
        },
        headers={"Retry-After": "60"},
    )


# Rate limit configurations
# Format: "requests/period" where period can be second, minute, hour, day
RATE_LIMITS = {
    # Authentication endpoints - stricter limits
    "auth_login": "5/minute",
    "auth_signup": "3/minute",

    # Task endpoints - reasonable limits
    "tasks_list": "60/minute",
    "tasks_create": "30/minute",
    "tasks_update": "30/minute",
    "tasks_delete": "30/minute",

    # Chat endpoints
    "chat_send": "10/minute",
    "chat_history": "30/minute",

    # General API limit
    "default": "100/minute",
}
