"""Data models for Todo Console App.

[From]: specs/003-task-schema/data-model.md, specs/003-task-schema/spec.md
"""

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any


@dataclass
class Result:
    """Result of an operation with success status, message, and optional data.

    All command operations return a Result to provide consistent feedback.
    """

    success: bool
    message: str
    data: Any = None


@dataclass
class Task:
    """A todo task with title, description, and completion status.

    Fields:
    - id: Unique task identifier (auto-generated, positive integer)
    - title: Task summary (1-200 characters, required)
    - description: Detailed information (0-1000 characters, optional)
    - completed: Whether the task is done (default: False)
    - created_at: UTC timestamp when task was created
    - updated_at: UTC timestamp when task was last modified
    """

    id: int
    title: str
    description: str = ""
    completed: bool = False
    created_at: datetime = field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = field(default_factory=lambda: datetime.now(UTC))

    def to_display_row(self, max_desc_len: int = 30) -> str:
        """Format task for list view display.

        Returns a formatted string like:
        "  1 [ ] Buy groceries                             Milk, eggs, bread..."
        """
        status = "[x]" if self.completed else "[ ]"
        desc = self.description
        if len(desc) > max_desc_len:
            desc = desc[: max_desc_len - 3] + "..."
        return f"{self.id:3} {status} {self.title[:40]:<40} {desc}"

    def to_detail(self) -> str:
        """Format task for detailed view.

        Returns a multi-line string with all task details.
        """
        status_str = "Completed" if self.completed else "Pending"
        desc_str = self.description if self.description else "(none)"
        return (
            f"ID:          {self.id}\n"
            f"Title:       {self.title}\n"
            f"Description: {desc_str}\n"
            f"Status:      {status_str}\n"
            f"Created:     {self.created_at.isoformat()}\n"
            f"Updated:     {self.updated_at.isoformat()}"
        )
