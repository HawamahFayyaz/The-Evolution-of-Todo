"""Unit tests for Task and Result dataclasses.

[From]: specs/003-task-schema/tasks.md T013
"""

from datetime import UTC, datetime

from src.models import Result, Task


class TestResult:
    """Tests for Result dataclass."""

    def test_result_success(self) -> None:
        """Test creating a successful result."""
        result = Result(success=True, message="Operation completed")
        assert result.success is True
        assert result.message == "Operation completed"
        assert result.data is None

    def test_result_failure(self) -> None:
        """Test creating a failure result."""
        result = Result(success=False, message="Something went wrong")
        assert result.success is False
        assert result.message == "Something went wrong"

    def test_result_with_data(self) -> None:
        """Test result with data payload."""
        data = {"key": "value"}
        result = Result(success=True, message="OK", data=data)
        assert result.data == data


class TestTask:
    """Tests for Task dataclass."""

    def test_task_creation_minimal(self) -> None:
        """Test creating a task with minimal fields."""
        task = Task(id=1, title="Buy groceries")
        assert task.id == 1
        assert task.title == "Buy groceries"
        assert task.description == ""
        assert task.completed is False
        assert isinstance(task.created_at, datetime)
        assert isinstance(task.updated_at, datetime)

    def test_task_creation_full(self) -> None:
        """Test creating a task with all fields."""
        now = datetime.now(UTC)
        task = Task(
            id=1,
            title="Buy groceries",
            description="Milk, eggs, bread",
            completed=True,
            created_at=now,
            updated_at=now,
        )
        assert task.id == 1
        assert task.title == "Buy groceries"
        assert task.description == "Milk, eggs, bread"
        assert task.completed is True
        assert task.created_at == now
        assert task.updated_at == now

    def test_task_timestamps_are_utc(self) -> None:
        """Test that default timestamps are in UTC."""
        task = Task(id=1, title="Test")
        assert task.created_at.tzinfo == UTC
        assert task.updated_at.tzinfo == UTC

    def test_task_to_display_row_pending(self) -> None:
        """Test display row format for pending task."""
        task = Task(id=1, title="Buy groceries", description="Milk, eggs")
        row = task.to_display_row()
        assert "  1" in row
        assert "[ ]" in row
        assert "Buy groceries" in row
        assert "Milk, eggs" in row

    def test_task_to_display_row_completed(self) -> None:
        """Test display row format for completed task."""
        task = Task(id=1, title="Buy groceries", completed=True)
        row = task.to_display_row()
        assert "[x]" in row

    def test_task_to_display_row_truncates_long_description(self) -> None:
        """Test that long descriptions are truncated."""
        long_desc = "A" * 50
        task = Task(id=1, title="Test", description=long_desc)
        row = task.to_display_row(max_desc_len=30)
        assert "..." in row
        assert len(row.split()[-1]) <= 30

    def test_task_to_detail(self) -> None:
        """Test detailed view format."""
        task = Task(id=1, title="Buy groceries", description="Milk, eggs")
        detail = task.to_detail()
        assert "ID:" in detail
        assert "1" in detail
        assert "Title:" in detail
        assert "Buy groceries" in detail
        assert "Description:" in detail
        assert "Milk, eggs" in detail
        assert "Status:" in detail
        assert "Pending" in detail

    def test_task_to_detail_completed(self) -> None:
        """Test detailed view shows completed status."""
        task = Task(id=1, title="Test", completed=True)
        detail = task.to_detail()
        assert "Completed" in detail

    def test_task_to_detail_empty_description(self) -> None:
        """Test detailed view with no description."""
        task = Task(id=1, title="Test", description="")
        detail = task.to_detail()
        assert "(none)" in detail
