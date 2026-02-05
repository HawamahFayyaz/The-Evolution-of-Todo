"""Database connection module with SQLModel engine."""

from collections.abc import Generator
from contextlib import contextmanager
from functools import lru_cache

from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from config import get_settings


@lru_cache
def get_engine():
    """Get or create database engine (cached singleton).

    Uses in-memory SQLite for testing when DATABASE_URL is not set.
    Uses PostgreSQL for production with Neon connection pooling.

    Neon-specific settings:
    - pool_pre_ping: Validates connections before use (handles cold starts)
    - pool_recycle: Recycles connections after 5 minutes
    - pool_size: Limited pool for serverless (3 connections)
    - connect_args with timeouts: Handles Neon wake-up delays
    """
    settings = get_settings()

    if not settings.database_url:
        # Testing mode: use in-memory SQLite
        return create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

    # Production mode: PostgreSQL with Neon-optimized settings
    return create_engine(
        settings.database_url,
        echo=False,
        pool_pre_ping=True,  # Validates connections (handles cold starts)
        pool_recycle=300,  # Recycle connections after 5 minutes
        pool_size=3,  # Small pool for serverless
        max_overflow=2,  # Allow 2 extra connections when busy
        connect_args={
            "connect_timeout": 30,  # 30 seconds for cold start wake-up
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
        },
    )




def create_db_and_tables() -> None:
    """Create all database tables from SQLModel metadata."""
    SQLModel.metadata.create_all(get_engine())


def get_session() -> Generator[Session, None, None]:
    """FastAPI dependency for database session.

    Yields:
        Session: SQLModel session for database operations.

    Example:
        @router.get("/tasks")
        async def list_tasks(session: Session = Depends(get_session)):
            return session.exec(select(Task)).all()
    """
    with Session(get_engine()) as session:
        yield session


@contextmanager
def get_session_context() -> Generator[Session, None, None]:
    """Context manager for database session (non-FastAPI use).

    Example:
        with get_session_context() as session:
            task = Task(title="Test")
            session.add(task)
            session.commit()
    """
    with Session(get_engine()) as session:
        yield session
