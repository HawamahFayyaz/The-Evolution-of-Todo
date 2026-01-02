"""Task storage layer with in-memory Dict[int, Task] backend.

[From]: specs/003-task-schema/data-model.md, specs/003-task-schema/plan.md
"""

from datetime import UTC, datetime

from src.models import Result, Task


class TaskStorage:
    """In-memory task storage with CRUD operations.

    Provides O(1) lookups by ID using a dictionary backend.
    IDs are never reused.

    Invariants:
    - _next_id always > max(task.id for all tasks)
    - All task IDs are unique
    - No ID is ever reused
    - All timestamps are UTC
    - updated_at >= created_at always
    """

    def __init__(self) -> None:
        """Initialize empty storage with ID counter starting at 1."""
        self._tasks: dict[int, Task] = {}
        self._next_id: int = 1

    def add(self, title: str, description: str = "") -> Task:
        """Add a new task with auto-generated ID and timestamps.

        Args:
            title: Task title (1-200 chars)
            description: Optional description (0-1000 chars)

        Returns:
            The created Task with generated ID and timestamps
        """
        now = datetime.now(UTC)
        task = Task(
            id=self._next_id,
            title=title,
            description=description,
            completed=False,
            created_at=now,
            updated_at=now,
        )
        self._tasks[self._next_id] = task
        self._next_id += 1
        return task

    def get(self, task_id: int) -> Task | None:
        """Get a task by ID.

        Args:
            task_id: The task ID to look up

        Returns:
            The Task if found, None otherwise
        """
        return self._tasks.get(task_id)

    def list_all(self, status: str | None = None) -> list[Task]:
        """List all tasks, optionally filtered by status.

        Args:
            status: Optional filter - "pending", "completed", or None for all

        Returns:
            List of tasks matching the filter, ordered by ID
        """
        tasks = list(self._tasks.values())

        if status == "pending":
            tasks = [t for t in tasks if not t.completed]
        elif status == "completed":
            tasks = [t for t in tasks if t.completed]

        return sorted(tasks, key=lambda t: t.id)

    def update(
        self, task_id: int, title: str, description: str | None = None
    ) -> Result:
        """Update a task's title and optionally description.

        Args:
            task_id: The task ID to update
            title: New title (1-200 chars)
            description: New description (None to keep existing)

        Returns:
            Result with success status and message
        """
        task = self._tasks.get(task_id)
        if task is None:
            return Result(
                success=False,
                message="Error: Task not found. Use 'list' to see available tasks",
            )

        task.title = title
        if description is not None:
            task.description = description
        task.updated_at = datetime.now(UTC)

        return Result(
            success=True,
            message=f"Task {task_id} updated successfully",
            data=task,
        )

    def delete(self, task_id: int) -> Result:
        """Delete a task by ID.

        Args:
            task_id: The task ID to delete

        Returns:
            Result with success status and message
        """
        task = self._tasks.get(task_id)
        if task is None:
            return Result(
                success=False,
                message="Error: Task not found. Use 'list' to see available tasks",
            )

        del self._tasks[task_id]
        return Result(
            success=True,
            message=f"Task {task_id} deleted successfully",
            data=task,
        )

    def toggle_complete(self, task_id: int) -> Result:
        """Toggle a task's completion status.

        Args:
            task_id: The task ID to toggle

        Returns:
            Result with success status and message indicating new state
        """
        task = self._tasks.get(task_id)
        if task is None:
            return Result(
                success=False,
                message="Error: Task not found. Use 'list' to see available tasks",
            )

        task.completed = not task.completed
        task.updated_at = datetime.now(UTC)

        status_msg = "complete" if task.completed else "pending"
        return Result(
            success=True,
            message=f"Task {task_id} marked as {status_msg}",
            data=task,
        )

    def count(self) -> tuple[int, int, int]:
        """Count tasks by status.

        Returns:
            Tuple of (total, pending, completed) counts
        """
        total = len(self._tasks)
        completed = sum(1 for t in self._tasks.values() if t.completed)
        pending = total - completed
        return (total, pending, completed)
