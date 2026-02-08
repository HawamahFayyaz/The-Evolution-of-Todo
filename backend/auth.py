"""Session verification module for authentication.

Verifies Better Auth session tokens by looking them up in the database.
"""

from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlmodel import Session

from database import get_session

# HTTP Bearer security scheme
security = HTTPBearer()


class AuthenticationError(HTTPException):
    """Custom exception for authentication failures."""

    def __init__(self, detail: str, code: str = "AUTHENTICATION_ERROR"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": code, "message": detail},
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_session_token(token: str, db: Session) -> str:
    """Verify a Better Auth session token by looking it up in the database.

    Args:
        token: Session token string from Authorization header.
        db: Database session for querying.

    Returns:
        str: User ID from the verified session.

    Raises:
        AuthenticationError: If session is invalid, expired, or not found.
    """
    # Query the session table (Better Auth schema)
    result = db.execute(
        text(
            """
            SELECT "userId", "expiresAt"
            FROM "session"
            WHERE "token" = :token
            """
        ),
        {"token": token},
    ).fetchone()

    if not result:
        raise AuthenticationError(
            "Invalid session. Please sign in again.",
            code="INVALID_SESSION",
        )

    user_id, expires_at = result

    # Check if session is expired
    # Handle timezone-aware, naive, and string datetimes from database
    if expires_at:
        now = datetime.now(timezone.utc)
        # SQLite may return datetime as string
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at).replace(tzinfo=timezone.utc)
        # If expires_at is naive (no timezone), assume it's UTC
        elif expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            raise AuthenticationError(
                "Session expired. Please sign in again.",
                code="EXPIRED_SESSION",
            )

    return user_id


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_session),
) -> str:
    """FastAPI dependency to extract user_id from session token.

    This dependency verifies the session token from the Authorization header
    by looking it up in the Better Auth session table.

    Args:
        credentials: HTTP Bearer credentials from request header.
        db: Database session for querying.

    Returns:
        str: User ID from the verified session.

    Raises:
        HTTPException: 401 if token is missing, invalid, or expired.

    Example:
        @router.get("/tasks")
        async def list_tasks(current_user: str = Depends(get_current_user)):
            # current_user is the verified user_id from session
            return get_user_tasks(current_user)

    Security Note:
        NEVER extract user_id from request body or URL parameters.
        ALWAYS use this dependency to get the authenticated user's ID.
    """
    return verify_session_token(credentials.credentials, db)


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        HTTPBearer(auto_error=False)
    ),
    db: Session = Depends(get_session),
) -> str | None:
    """FastAPI dependency for optional authentication.

    Returns user_id if valid token provided, None otherwise.
    Useful for endpoints that work both authenticated and unauthenticated.

    Args:
        credentials: Optional HTTP Bearer credentials.
        db: Database session for querying.

    Returns:
        str | None: User ID if authenticated, None otherwise.
    """
    if not credentials:
        return None

    try:
        return verify_session_token(credentials.credentials, db)
    except HTTPException:
        return None
