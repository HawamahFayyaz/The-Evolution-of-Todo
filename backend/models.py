"""SQLModel schemas for database entities."""

from datetime import UTC, datetime
from enum import Enum
from functools import partial
from typing import ClassVar

from sqlalchemy import Index
from sqlmodel import Field, SQLModel


class TaskPriority(str, Enum):
    """Task priority levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Task(SQLModel, table=True):
    """Task entity representing a user's to-do item.

    Attributes:
        id: Unique task identifier (auto-generated).
        user_id: Owner's user ID from JWT token (indexed for queries).
        title: Task title (required, max 200 characters).
        description: Optional task description (max 1000 characters).
        completed: Task completion status (default: False).
        priority: Task priority level (low, medium, high).
        due_date: Optional due date for the task.
        created_at: Timestamp of task creation (UTC).
        updated_at: Timestamp of last modification (UTC).
        deleted_at: Soft delete timestamp (nullable, UTC).

    Indexes:
        - user_id: For filtering tasks by owner
        - deleted_at: For filtering out soft-deleted tasks
        - created_at: For sorting by creation date
        - completed: For filtering by status
        - due_date: For sorting by due date
        - priority: For filtering/sorting by priority
        - ix_tasks_user_active: Composite index for common query pattern

    Security:
        user_id is ALWAYS set from the JWT token, never from request body.
        All queries MUST filter by user_id AND deleted_at IS NULL.
    """

    __tablename__ = "tasks"

    # Composite index for the most common query pattern:
    # SELECT * FROM tasks WHERE user_id = ? AND deleted_at IS NULL ORDER BY created_at DESC
    __table_args__: ClassVar[tuple] = (
        Index("ix_tasks_user_active", "user_id", "deleted_at", "created_at"),
        Index("ix_tasks_user_completed", "user_id", "completed"),
        Index("ix_tasks_user_due_date", "user_id", "due_date"),
        Index("ix_tasks_user_priority", "user_id", "priority"),
    )

    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, min_length=1)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=1000)
    completed: bool = Field(default=False, index=True)
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM, index=True)
    due_date: datetime | None = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=partial(datetime.now, UTC), index=True)
    updated_at: datetime = Field(default_factory=partial(datetime.now, UTC))
    deleted_at: datetime | None = Field(default=None, index=True)


class TaskCreate(SQLModel):
    """Schema for creating a new task.

    Note: user_id is NOT included - it comes from JWT token.
    """

    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=1000)
    priority: TaskPriority = Field(default=TaskPriority.MEDIUM)
    due_date: datetime | None = Field(default=None)


class TaskUpdate(SQLModel):
    """Schema for updating an existing task.

    All fields are optional - only provided fields are updated.
    """

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    priority: TaskPriority | None = Field(default=None)
    due_date: datetime | None = Field(default=None)


class TaskResponse(SQLModel):
    """Schema for task API responses."""

    id: int
    user_id: str
    title: str
    description: str
    completed: bool
    priority: TaskPriority
    due_date: datetime | None
    created_at: datetime
    updated_at: datetime
