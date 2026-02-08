"""Tests for AI agent function tools.

Tests the raw _impl functions directly (bypassing @function_tool decorator)
to validate tool logic with real database sessions.
"""

import pytest
from sqlmodel import Session

from agent.tools import (
    _add_task_impl,
    _list_tasks_impl,
    _complete_task_impl,
    _delete_task_impl,
    _update_task_impl,
)
from models import Task


class TestAddTask:
    """Tests for add_task tool."""

    def test_add_task_success(self, session: Session) -> None:
        """Successfully creates a task and returns task_id."""
        result = _add_task_impl("user-1", session, title="Buy groceries")

        assert result["success"] is True
        assert result["task_id"] is not None
        assert result["title"] == "Buy groceries"
        assert result["status"] == "pending"

    def test_add_task_with_description(self, session: Session) -> None:
        """Creates a task with description."""
        result = _add_task_impl(
            "user-1", session, title="Shopping", description="Get milk and eggs"
        )

        assert result["success"] is True
        assert result["description"] == "Get milk and eggs"

    def test_add_task_with_due_date(self, session: Session) -> None:
        """Creates a task with due_date."""
        result = _add_task_impl("user-1", session, title="Meeting", due_date="2026-03-15")

        assert result["success"] is True

    def test_add_task_invalid_date(self, session: Session) -> None:
        """Invalid date format returns validation error."""
        result = _add_task_impl("user-1", session, title="Meeting", due_date="not-a-date")

        assert result["success"] is False
        assert result["error_code"] == "VALIDATION_ERROR"


class TestListTasks:
    """Tests for list_tasks tool."""

    def test_list_tasks_empty(self, session: Session) -> None:
        """Returns empty list when user has no tasks."""
        result = _list_tasks_impl("user-1", session)

        assert result["success"] is True
        assert result["tasks"] == []
        assert result["count"] == 0

    def test_list_tasks_with_data(self, session: Session) -> None:
        """Returns user's tasks."""
        task = Task(user_id="user-1", title="Test task")
        session.add(task)
        session.commit()

        result = _list_tasks_impl("user-1", session)

        assert result["success"] is True
        assert result["count"] == 1
        assert result["tasks"][0]["title"] == "Test task"

    def test_list_tasks_status_filter(self, session: Session) -> None:
        """Filters tasks by status."""
        task1 = Task(user_id="user-1", title="Pending task", completed=False)
        task2 = Task(user_id="user-1", title="Done task", completed=True)
        session.add_all([task1, task2])
        session.commit()

        # Pending only
        result = _list_tasks_impl("user-1", session, status="pending")
        assert result["count"] == 1
        assert result["tasks"][0]["title"] == "Pending task"

        # Completed only
        result = _list_tasks_impl("user-1", session, status="completed")
        assert result["count"] == 1
        assert result["tasks"][0]["title"] == "Done task"

    def test_list_tasks_excludes_deleted(self, session: Session) -> None:
        """Soft-deleted tasks are not returned."""
        from datetime import UTC, datetime

        task = Task(
            user_id="user-1",
            title="Deleted task",
            deleted_at=datetime.now(UTC),
        )
        session.add(task)
        session.commit()

        result = _list_tasks_impl("user-1", session)

        assert result["count"] == 0

    def test_list_tasks_isolates_users(self, session: Session) -> None:
        """User only sees their own tasks."""
        task1 = Task(user_id="user-1", title="User 1 task")
        task2 = Task(user_id="user-2", title="User 2 task")
        session.add_all([task1, task2])
        session.commit()

        result = _list_tasks_impl("user-1", session)

        assert result["count"] == 1
        assert result["tasks"][0]["title"] == "User 1 task"


class TestCompleteTask:
    """Tests for complete_task tool."""

    def test_complete_task_success(self, session: Session) -> None:
        """Marks a task as completed."""
        task = Task(user_id="user-1", title="Test task")
        session.add(task)
        session.commit()
        session.refresh(task)

        result = _complete_task_impl("user-1", session, task_id=task.id)

        assert result["success"] is True
        assert result["status"] == "completed"

    def test_complete_already_completed(self, session: Session) -> None:
        """Already-completed task returns success with message."""
        task = Task(user_id="user-1", title="Test task", completed=True)
        session.add(task)
        session.commit()
        session.refresh(task)

        result = _complete_task_impl("user-1", session, task_id=task.id)

        assert result["success"] is True
        assert "already completed" in result["message"]

    def test_complete_task_not_found(self, session: Session) -> None:
        """Non-existent task returns TASK_NOT_FOUND."""
        result = _complete_task_impl("user-1", session, task_id=99999)

        assert result["success"] is False
        assert result["error_code"] == "TASK_NOT_FOUND"

    def test_complete_task_wrong_owner(self, session: Session) -> None:
        """Other user's task returns TASK_NOT_FOUND (prevents enumeration)."""
        task = Task(user_id="user-2", title="Other's task")
        session.add(task)
        session.commit()
        session.refresh(task)

        result = _complete_task_impl("user-1", session, task_id=task.id)

        assert result["success"] is False
        assert result["error"] == "Task not found"


class TestDeleteTask:
    """Tests for delete_task tool."""

    def test_delete_task_success(self, session: Session) -> None:
        """Soft deletes a task."""
        task = Task(user_id="user-1", title="Test task")
        session.add(task)
        session.commit()
        session.refresh(task)

        result = _delete_task_impl("user-1", session, task_id=task.id)

        assert result["success"] is True
        assert result["title"] == "Test task"

        # Verify soft delete
        session.refresh(task)
        assert task.deleted_at is not None

    def test_delete_task_not_found(self, session: Session) -> None:
        """Non-existent task returns TASK_NOT_FOUND."""
        result = _delete_task_impl("user-1", session, task_id=99999)

        assert result["success"] is False
        assert result["error_code"] == "TASK_NOT_FOUND"

    def test_delete_task_wrong_owner(self, session: Session) -> None:
        """Other user's task returns TASK_NOT_FOUND."""
        task = Task(user_id="user-2", title="Other's task")
        session.add(task)
        session.commit()
        session.refresh(task)

        result = _delete_task_impl("user-1", session, task_id=task.id)

        assert result["success"] is False
        assert result["error"] == "Task not found"


class TestUpdateTask:
    """Tests for update_task tool."""

    def test_update_task_title(self, session: Session) -> None:
        """Updates task title."""
        task = Task(user_id="user-1", title="Old title")
        session.add(task)
        session.commit()
        session.refresh(task)

        result = _update_task_impl("user-1", session, task_id=task.id, title="New title")

        assert result["success"] is True
        assert result["title"] == "New title"

    def test_update_task_no_fields(self, session: Session) -> None:
        """No fields provided returns validation error."""
        task = Task(user_id="user-1", title="Test")
        session.add(task)
        session.commit()
        session.refresh(task)

        result = _update_task_impl("user-1", session, task_id=task.id)

        assert result["success"] is False
        assert result["error_code"] == "VALIDATION_ERROR"

    def test_update_task_not_found(self, session: Session) -> None:
        """Non-existent task returns TASK_NOT_FOUND."""
        result = _update_task_impl("user-1", session, task_id=99999, title="New")

        assert result["success"] is False
        assert result["error_code"] == "TASK_NOT_FOUND"
