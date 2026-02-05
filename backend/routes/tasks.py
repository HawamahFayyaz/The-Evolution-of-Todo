"""Task CRUD API routes.

All endpoints require JWT authentication and enforce data isolation.
User ID is extracted from the JWT token - NEVER from request body.
"""

from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from auth import get_current_user
from database import get_session
from models import Task
from security_logger import security_logger

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


# Request/Response Models
class TaskCreate(BaseModel):
    """Request model for creating a task."""

    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=1000)


class TaskUpdate(BaseModel):
    """Request model for updating a task."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    completed: bool | None = None


class TaskResponse(BaseModel):
    """Response model for task data."""

    id: int
    title: str
    description: str
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    """Response model for task list."""

    tasks: list[TaskResponse]
    total: int


# Helper functions
def get_user_task(
    task_id: int,
    user_id: str,
    session: Session,
    request: Request | None = None,
    action: str = "read",
) -> Task:
    """Get a task by ID, ensuring it belongs to the user and is not deleted.

    Also logs security events for cross-user access attempts.

    Args:
        task_id: Task ID to retrieve.
        user_id: User ID from JWT token.
        session: Database session.
        request: FastAPI request object for logging IP/user agent.
        action: Action being attempted (read, update, delete).

    Returns:
        Task: The task if found and owned by user.

    Raises:
        HTTPException: 404 if task not found or not owned by user.
    """
    # First, check if task exists (regardless of owner)
    task = session.exec(
        select(Task).where(
            Task.id == task_id,
            Task.deleted_at.is_(None),
        )
    ).first()

    if not task:
        # Task genuinely doesn't exist
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TASK_NOT_FOUND", "message": "Task not found"},
        )

    if task.user_id != user_id:
        # SECURITY: Cross-user access attempt detected
        # Log this suspicious activity
        ip_address = None
        user_agent = None
        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")

        security_logger.log_cross_user_access(
            attempting_user_id=user_id,
            resource_type="task",
            resource_id=task_id,
            actual_owner_id=task.user_id,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        # Return 404 to prevent enumeration (don't reveal task exists)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "TASK_NOT_FOUND", "message": "Task not found"},
        )

    return task


# Endpoints
@router.get("", response_model=TaskListResponse)
async def list_tasks(
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_user),
    completed: bool | None = None,
) -> TaskListResponse:
    """List all tasks for the authenticated user.

    Args:
        session: Database session.
        current_user: User ID from JWT token.
        completed: Optional filter by completion status.

    Returns:
        TaskListResponse: List of tasks with total count.
    """
    query = select(Task).where(
        Task.user_id == current_user,
        Task.deleted_at.is_(None),
    )

    if completed is not None:
        query = query.where(Task.completed == completed)

    query = query.order_by(Task.created_at.desc())
    tasks = session.exec(query).all()

    return TaskListResponse(
        tasks=[TaskResponse.model_validate(t) for t in tasks],
        total=len(tasks),
    )


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_user),
) -> TaskResponse:
    """Get a specific task by ID.

    Args:
        task_id: Task ID to retrieve.
        request: FastAPI request object.
        session: Database session.
        current_user: User ID from JWT token.

    Returns:
        TaskResponse: The requested task.

    Raises:
        HTTPException: 404 if task not found.
    """
    task = get_user_task(task_id, current_user, session, request, action="read")
    return TaskResponse.model_validate(task)


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_user),
) -> TaskResponse:
    """Create a new task for the authenticated user.

    Args:
        task_data: Task creation data (title, description).
        session: Database session.
        current_user: User ID from JWT token (NEVER from request body).

    Returns:
        TaskResponse: The created task.
    """
    # User ID comes from JWT token - never from request body
    task = Task(
        user_id=current_user,
        title=task_data.title,
        description=task_data.description,
    )

    session.add(task)
    session.commit()
    session.refresh(task)

    return TaskResponse.model_validate(task)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    request: Request,
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_user),
) -> TaskResponse:
    """Update an existing task.

    Args:
        task_id: Task ID to update.
        task_data: Fields to update (all optional).
        request: FastAPI request object.
        session: Database session.
        current_user: User ID from JWT token.

    Returns:
        TaskResponse: The updated task.

    Raises:
        HTTPException: 404 if task not found.
    """
    task = get_user_task(task_id, current_user, session, request, action="update")

    # Update only provided fields
    if task_data.title is not None:
        task.title = task_data.title
    if task_data.description is not None:
        task.description = task_data.description
    if task_data.completed is not None:
        task.completed = task_data.completed

    task.updated_at = datetime.now(UTC)

    session.add(task)
    session.commit()
    session.refresh(task)

    return TaskResponse.model_validate(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_user),
) -> None:
    """Soft delete a task (sets deleted_at timestamp).

    Per constitution: NEVER hard delete data.

    Args:
        task_id: Task ID to delete.
        request: FastAPI request object.
        session: Database session.
        current_user: User ID from JWT token.

    Raises:
        HTTPException: 404 if task not found.
    """
    task = get_user_task(task_id, current_user, session, request, action="delete")

    # Soft delete - never hard delete
    task.deleted_at = datetime.now(UTC)
    task.updated_at = datetime.now(UTC)

    session.add(task)
    session.commit()


@router.patch("/{task_id}/complete", response_model=TaskResponse)
async def toggle_task_completion(
    task_id: int,
    request: Request,
    session: Session = Depends(get_session),
    current_user: str = Depends(get_current_user),
) -> TaskResponse:
    """Toggle task completion status.

    Args:
        task_id: Task ID to toggle.
        request: FastAPI request object.
        session: Database session.
        current_user: User ID from JWT token.

    Returns:
        TaskResponse: The updated task.

    Raises:
        HTTPException: 404 if task not found.
    """
    task = get_user_task(task_id, current_user, session, request, action="toggle")

    task.completed = not task.completed
    task.updated_at = datetime.now(UTC)

    session.add(task)
    session.commit()
    session.refresh(task)

    return TaskResponse.model_validate(task)
