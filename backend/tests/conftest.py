"""Pytest fixtures for backend tests."""

from collections.abc import Generator
from datetime import UTC, datetime, timedelta
from typing import Any
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from config import get_settings
from main import app
from database import get_session


# Test database engine (in-memory SQLite for tests)
test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


def get_test_session() -> Generator[Session, None, None]:
    """Override database session for tests."""
    with Session(test_engine) as session:
        yield session


def create_session_table(session: Session) -> None:
    """Create Better Auth session table for testing."""
    # Create a minimal session table matching Better Auth schema
    session.execute(
        text(
            """
            CREATE TABLE IF NOT EXISTS "session" (
                "id" TEXT PRIMARY KEY,
                "token" TEXT NOT NULL UNIQUE,
                "userId" TEXT NOT NULL,
                "expiresAt" DATETIME NOT NULL,
                "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
    )
    session.commit()


def insert_test_session(
    session: Session,
    token: str,
    user_id: str,
    expires_at: datetime | None = None,
) -> None:
    """Insert a test session into the database.

    Args:
        session: Database session.
        token: Session token.
        user_id: User ID for the session.
        expires_at: When the session expires (default: 7 days from now).
    """
    if expires_at is None:
        expires_at = datetime.now(UTC) + timedelta(days=7)

    # Convert to naive datetime for SQLite compatibility
    if expires_at.tzinfo is not None:
        expires_at = expires_at.replace(tzinfo=None)

    session.execute(
        text(
            """
            INSERT INTO "session" ("id", "token", "userId", "expiresAt")
            VALUES (:id, :token, :user_id, :expires_at)
            """
        ),
        {
            "id": str(uuid.uuid4()),
            "token": token,
            "user_id": user_id,
            "expires_at": expires_at,
        },
    )
    session.commit()


@pytest.fixture(scope="function")
def session() -> Generator[Session, None, None]:
    """Create a fresh database session for each test.

    Yields:
        Session: SQLModel session connected to test database.
    """
    SQLModel.metadata.create_all(test_engine)
    with Session(test_engine) as session:
        # Create session table for auth tests
        create_session_table(session)
        yield session
    SQLModel.metadata.drop_all(test_engine)
    # Drop session table manually since it's not part of SQLModel metadata
    with Session(test_engine) as cleanup_session:
        try:
            cleanup_session.execute(text('DROP TABLE IF EXISTS "session"'))
            cleanup_session.commit()
        except Exception:
            pass


@pytest.fixture(scope="function")
def client(session: Session) -> Generator[TestClient, None, None]:
    """Create a test client with database session override.

    Args:
        session: Test database session fixture.

    Yields:
        TestClient: FastAPI test client for making requests.
    """
    app.dependency_overrides[get_session] = lambda: session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_id() -> str:
    """Return a consistent test user ID.

    Returns:
        str: Test user ID for use in tests.
    """
    return "test-user-123"


@pytest.fixture
def other_user_id() -> str:
    """Return a different user ID for isolation tests.

    Returns:
        str: Another test user ID.
    """
    return "other-user-456"


def create_jwt_token(
    user_id: str,
    db_session: Session | None = None,
    expired: bool = False,
) -> str:
    """Create a session token for testing.

    If db_session is provided, inserts the token into the session table.
    Otherwise, just returns a token string (useful for testing invalid tokens).

    Args:
        user_id: User ID to associate with the token.
        db_session: Database session (if provided, inserts token into DB).
        expired: If True, create an expired session.

    Returns:
        str: Session token.
    """
    # Generate a unique token
    token = f"test-session-{user_id}-{uuid.uuid4()}"

    if db_session is not None:
        expires_at = (
            datetime.now(UTC) - timedelta(hours=1)
            if expired
            else datetime.now(UTC) + timedelta(days=7)
        )
        insert_test_session(db_session, token, user_id, expires_at)

    return token


@pytest.fixture
def valid_token(test_user_id: str, session: Session) -> str:
    """Create a valid session token for the test user.

    Args:
        test_user_id: Test user ID fixture.
        session: Database session fixture.

    Returns:
        str: Valid session token.
    """
    return create_jwt_token(test_user_id, db_session=session)


@pytest.fixture
def expired_token(test_user_id: str, session: Session) -> str:
    """Create an expired session token.

    Args:
        test_user_id: Test user ID fixture.
        session: Database session fixture.

    Returns:
        str: Expired session token.
    """
    return create_jwt_token(test_user_id, db_session=session, expired=True)


@pytest.fixture
def invalid_token(test_user_id: str) -> str:
    """Create a token that doesn't exist in the database.

    Args:
        test_user_id: Test user ID fixture.

    Returns:
        str: Token not in database (invalid).
    """
    return f"invalid-token-not-in-db-{test_user_id}"


@pytest.fixture
def other_user_token(other_user_id: str, session: Session) -> str:
    """Create a valid session token for a different user.

    Args:
        other_user_id: Other user ID fixture.
        session: Database session fixture.

    Returns:
        str: Valid session token for other user.
    """
    return create_jwt_token(other_user_id, db_session=session)


def auth_header(token: str) -> dict[str, str]:
    """Create authorization header dictionary.

    Args:
        token: JWT token.

    Returns:
        dict: Headers with Authorization.
    """
    return {"Authorization": f"Bearer {token}"}
