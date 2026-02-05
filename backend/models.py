"""SQLModel schemas for database entities."""

from datetime import UTC, datetime
from functools import partial

from sqlmodel import Field, SQLModel


class Task(SQLModel, table=True):
    """Task entity representing a user's to-do item.

    Attributes:
        id: Unique task identifier (auto-generated).
        user_id: Owner's user ID from JWT token (indexed for queries).
        title: Task title (required, max 200 characters).
        description: Optional task description (max 1000 characters).
        completed: Task completion status (default: False).
        created_at: Timestamp of task creation (UTC).
        updated_at: Timestamp of last modification (UTC).
        deleted_at: Soft delete timestamp (nullable, UTC).

    Security:
        user_id is ALWAYS set from the JWT token, never from request body.
        All queries MUST filter by user_id AND deleted_at IS NULL.
    """

    __tablename__ = "tasks"

    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, min_length=1)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=1000)
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=partial(datetime.now, UTC))
    updated_at: datetime = Field(default_factory=partial(datetime.now, UTC))
    deleted_at: datetime | None = Field(default=None, index=True)


class TaskCreate(SQLModel):
    """Schema for creating a new task.

    Note: user_id is NOT included - it comes from JWT token.
    """

    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=1000)


class TaskUpdate(SQLModel):
    """Schema for updating an existing task.

    All fields are optional - only provided fields are updated.
    """

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)


class TaskResponse(SQLModel):
    """Schema for task API responses."""

    id: int
    user_id: str
    title: str
    description: str
    completed: bool
    created_at: datetime
    updated_at: datetime
