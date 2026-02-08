"""MCP function tools for AI agent task management.

Each tool is a @function_tool decorated function created via closure
to inject user_id and session without exposing them to the AI agent.

Architecture:
- Raw logic in _impl functions (testable directly)
- @function_tool wrappers for AI agent integration
"""

from datetime import UTC, datetime

from agents import function_tool
from sqlmodel import Session, select

from models import Task


def _add_task_impl(
    user_id: str, session: Session, title: str, description: str = "", due_date: str | None = None
) -> dict:
    """Raw implementation for add_task."""
    parsed_due_date = None
    if due_date:
        try:
            parsed_due_date = datetime.fromisoformat(due_date)
        except ValueError:
            return {
                "success": False,
                "error": f"Invalid date format: {due_date}. Use YYYY-MM-DD.",
                "error_code": "VALIDATION_ERROR",
            }

    task = Task(
        user_id=user_id,
        title=title.strip(),
        description=description.strip(),
        due_date=parsed_due_date,
    )
    session.add(task)
    session.commit()
    session.refresh(task)

    return {
        "success": True,
        "task_id": task.id,
        "title": task.title,
        "description": task.description,
        "status": "pending",
        "message": f"Task '{task.title}' created successfully.",
    }


def _list_tasks_impl(user_id: str, session: Session, status: str = "all") -> dict:
    """Raw implementation for list_tasks."""
    query = select(Task).where(
        Task.user_id == user_id,
        Task.deleted_at.is_(None),
    )

    if status == "pending":
        query = query.where(Task.completed == False)  # noqa: E712
    elif status == "completed":
        query = query.where(Task.completed == True)  # noqa: E712

    query = query.order_by(Task.created_at.desc())
    tasks = session.exec(query).all()

    task_list = [
        {
            "task_id": t.id,
            "title": t.title,
            "description": t.description,
            "completed": t.completed,
            "priority": t.priority.value if t.priority else "medium",
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in tasks
    ]

    return {
        "success": True,
        "tasks": task_list,
        "count": len(task_list),
        "message": f"Found {len(task_list)} task(s).",
    }


def _complete_task_impl(user_id: str, session: Session, task_id: int) -> dict:
    """Raw implementation for complete_task."""
    task = session.exec(
        select(Task).where(
            Task.id == task_id,
            Task.deleted_at.is_(None),
        )
    ).first()

    if not task or task.user_id != user_id:
        return {
            "success": False,
            "error": "Task not found",
            "error_code": "TASK_NOT_FOUND",
        }

    if task.completed:
        return {
            "success": True,
            "task_id": task.id,
            "title": task.title,
            "status": "completed",
            "message": f"Task '{task.title}' is already completed.",
        }

    task.completed = True
    task.updated_at = datetime.now(UTC)
    session.add(task)
    session.commit()
    session.refresh(task)

    return {
        "success": True,
        "task_id": task.id,
        "title": task.title,
        "status": "completed",
        "completed_at": task.updated_at.isoformat(),
        "message": f"Task '{task.title}' marked as completed.",
    }


def _delete_task_impl(user_id: str, session: Session, task_id: int) -> dict:
    """Raw implementation for delete_task."""
    task = session.exec(
        select(Task).where(
            Task.id == task_id,
            Task.deleted_at.is_(None),
        )
    ).first()

    if not task or task.user_id != user_id:
        return {
            "success": False,
            "error": "Task not found",
            "error_code": "TASK_NOT_FOUND",
        }

    task.deleted_at = datetime.now(UTC)
    task.updated_at = datetime.now(UTC)
    session.add(task)
    session.commit()

    return {
        "success": True,
        "task_id": task.id,
        "title": task.title,
        "message": f"Task '{task.title}' deleted successfully.",
    }


def _update_task_impl(
    user_id: str,
    session: Session,
    task_id: int,
    title: str | None = None,
    description: str | None = None,
    due_date: str | None = None,
) -> dict:
    """Raw implementation for update_task."""
    if title is None and description is None and due_date is None:
        return {
            "success": False,
            "error": "At least one field (title, description, or due_date) must be provided.",
            "error_code": "VALIDATION_ERROR",
        }

    task = session.exec(
        select(Task).where(
            Task.id == task_id,
            Task.deleted_at.is_(None),
        )
    ).first()

    if not task or task.user_id != user_id:
        return {
            "success": False,
            "error": "Task not found",
            "error_code": "TASK_NOT_FOUND",
        }

    if title is not None:
        task.title = title.strip()
    if description is not None:
        task.description = description.strip()
    if due_date is not None:
        try:
            task.due_date = datetime.fromisoformat(due_date)
        except ValueError:
            return {
                "success": False,
                "error": f"Invalid date format: {due_date}. Use YYYY-MM-DD.",
                "error_code": "VALIDATION_ERROR",
            }

    task.updated_at = datetime.now(UTC)
    session.add(task)
    session.commit()
    session.refresh(task)

    return {
        "success": True,
        "task_id": task.id,
        "title": task.title,
        "description": task.description,
        "updated_at": task.updated_at.isoformat(),
        "message": f"Task '{task.title}' updated successfully.",
    }


def create_tools_for_user(user_id: str, session: Session) -> list:
    """Create all 5 task management tools with user_id bound via closure.

    The AI agent never sees user_id — it's injected automatically from
    the authenticated session token.

    Args:
        user_id: Authenticated user's ID from session token.
        session: Database session for queries.

    Returns:
        list: List of 5 FunctionTool instances.
    """

    @function_tool
    def add_task(title: str, description: str = "", due_date: str | None = None) -> dict:
        """Create a new todo task for the user.

        Args:
            title: The task title (required).
            description: Optional task description.
            due_date: Optional due date in ISO format (YYYY-MM-DD).
        """
        return _add_task_impl(user_id, session, title, description, due_date)

    @function_tool
    def list_tasks(status: str = "all") -> dict:
        """List the user's todo tasks, optionally filtered by status.

        Args:
            status: Filter by status - 'all', 'pending', or 'completed'.
        """
        return _list_tasks_impl(user_id, session, status)

    @function_tool
    def complete_task(task_id: int) -> dict:
        """Mark a task as completed.

        Args:
            task_id: The ID of the task to complete.
        """
        return _complete_task_impl(user_id, session, task_id)

    @function_tool
    def delete_task(task_id: int) -> dict:
        """Delete a task (soft delete).

        Args:
            task_id: The ID of the task to delete.
        """
        return _delete_task_impl(user_id, session, task_id)

    @function_tool
    def update_task(
        task_id: int,
        title: str | None = None,
        description: str | None = None,
        due_date: str | None = None,
    ) -> dict:
        """Update an existing task's title, description, or due date.

        Args:
            task_id: The ID of the task to update.
            title: New title (optional).
            description: New description (optional).
            due_date: New due date in ISO format YYYY-MM-DD (optional).
        """
        return _update_task_impl(user_id, session, task_id, title, description, due_date)

    return [add_task, list_tasks, complete_task, delete_task, update_task]
