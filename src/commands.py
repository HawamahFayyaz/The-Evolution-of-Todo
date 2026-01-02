"""Command handlers for Todo Console App.

[From]: specs/003-task-schema/contracts/cli-interface.md, specs/003-task-schema/plan.md
"""

from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import TYPE_CHECKING

from src.models import Result
from src.storage import TaskStorage
from src.utils import validate_description, validate_id, validate_title

if TYPE_CHECKING:
    pass


class Command(ABC):
    """Base class for all commands."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Return the command name for routing."""
        ...

    @property
    @abstractmethod
    def description(self) -> str:
        """Return short description for help listing."""
        ...

    @abstractmethod
    def execute(self, *args: str) -> Result:
        """Execute the command with given arguments."""
        ...

    @abstractmethod
    def help(self) -> str:
        """Return detailed help text for this command."""
        ...


class AddCommand(Command):
    """Create a new task with title and optional description via interactive prompts."""

    def __init__(
        self,
        storage: TaskStorage,
        input_fn: Callable[[], str] | None = None,
        print_fn: Callable[[str], None] | None = None,
    ) -> None:
        self._storage = storage
        self._input_fn = input_fn or input
        self._print_fn = print_fn or (lambda s: print(s, end=""))

    @property
    def name(self) -> str:
        return "add"

    @property
    def description(self) -> str:
        return "Create a new task"

    def execute(self, *args: str) -> Result:
        """Add a task via interactive prompts.

        Prompts user for title and optional description.
        """
        # Prompt for title
        try:
            self._print_fn("Enter task title: ")
            title = self._input_fn().strip()
        except (EOFError, KeyboardInterrupt):
            return Result(success=False, message="Task creation cancelled")

        # Validate title
        title_result = validate_title(title)
        if not title_result.success:
            return title_result

        # Prompt for description
        try:
            self._print_fn("Enter task description (optional, press Enter to skip): ")
            description = self._input_fn().strip()
        except (EOFError, KeyboardInterrupt):
            description = ""

        # Validate description
        desc_result = validate_description(description)
        if not desc_result.success:
            return desc_result

        task = self._storage.add(title, description)
        return Result(
            success=True,
            message=f"Task {task.id} created successfully",
            data=task,
        )

    def help(self) -> str:
        return """add

Create a new task with interactive prompts for title and description.

Usage:
  Type 'add' and press Enter
  Enter the task title when prompted
  Enter an optional description or press Enter to skip

Example session:
  > add
  Enter task title: Buy groceries
  Enter task description (optional, press Enter to skip): Milk, eggs, bread
  Task 1 created successfully
"""


class ListCommand(Command):
    """Show tasks with optional status filter."""

    def __init__(self, storage: TaskStorage) -> None:
        self._storage = storage

    @property
    def name(self) -> str:
        return "list"

    @property
    def description(self) -> str:
        return "Show tasks (all/pending/completed)"

    def execute(self, *args: str) -> Result:
        """List tasks with optional status filter.

        Args:
            args[0]: status filter (optional) - "all", "pending", or "completed"
        """
        status = args[0] if args else None

        if status and status not in ("all", "pending", "completed"):
            return Result(
                success=False,
                message="Error: Invalid status. Use 'all', 'pending', or 'completed'",
            )

        # Treat "all" as no filter
        if status == "all":
            status = None

        tasks = self._storage.list_all(status)

        if not tasks:
            return Result(
                success=True,
                message="No tasks found. Add your first task with: add <title>",
                data=[],
            )

        # Build output
        lines = ["ID  Status  Title                                     Description"]
        for task in tasks:
            lines.append(task.to_display_row())

        total, pending, completed = self._storage.count()
        task_word = "task" if total == 1 else "tasks"
        lines.append("")
        summary = f"{total} {task_word} total, {pending} pending, {completed} completed"
        lines.append(summary)

        return Result(
            success=True,
            message="\n".join(lines),
            data=tasks,
        )

    def help(self) -> str:
        return """list [status]

Show tasks with optional status filter.

Arguments:
  status - Filter by "all" (default), "pending", or "completed"

Examples:
  list
  list pending
  list completed
"""


class UpdateCommand(Command):
    """Modify a task's title and/or description via interactive prompts."""

    def __init__(
        self,
        storage: TaskStorage,
        input_fn: Callable[[], str] | None = None,
        print_fn: Callable[[str], None] | None = None,
    ) -> None:
        self._storage = storage
        self._input_fn = input_fn or input
        self._print_fn = print_fn or (lambda s: print(s, end=""))

    @property
    def name(self) -> str:
        return "update"

    @property
    def description(self) -> str:
        return "Modify a task"

    def execute(self, *args: str) -> Result:
        """Update a task via interactive prompts.

        Args:
            args[0]: task ID (required)
        """
        if len(args) < 1:
            return Result(
                success=False,
                message="Error: Task ID is required. Usage: update <id>",
            )

        id_str = args[0]

        # Validate ID
        id_result = validate_id(id_str)
        if not id_result.success:
            return id_result

        task_id = id_result.data
        task = self._storage.get(task_id)

        if task is None:
            return Result(
                success=False,
                message="Error: Task not found. Use 'list' to see available tasks",
            )

        # Show current task info
        self._print_fn(f"Current task: {task.title}\n")
        if task.description:
            self._print_fn(f"Current description: {task.description}\n")

        # Prompt for new title
        try:
            self._print_fn("Enter new title (or press Enter to keep current): ")
            new_title = self._input_fn().strip()
        except (EOFError, KeyboardInterrupt):
            return Result(success=False, message="Update cancelled")

        # Use current title if empty
        new_title = new_title or task.title

        # Validate title
        title_result = validate_title(new_title)
        if not title_result.success:
            return title_result

        # Prompt for new description
        try:
            self._print_fn("Enter new description (or press Enter to keep current): ")
            new_description = self._input_fn().strip()
        except (EOFError, KeyboardInterrupt):
            new_description = task.description

        # Use current description if empty input
        if new_description == "":
            new_description = task.description

        # Validate description
        desc_result = validate_description(new_description)
        if not desc_result.success:
            return desc_result

        return self._storage.update(task_id, new_title, new_description)

    def help(self) -> str:
        return """update <id>

Modify a task's title and/or description with interactive prompts.

Usage:
  Type 'update <id>' and press Enter
  Enter a new title or press Enter to keep the current one
  Enter a new description or press Enter to keep the current one

Arguments:
  id - Task ID to update

Example session:
  > update 1
  Current task: Buy groceries
  Current description: Milk, eggs
  Enter new title (or press Enter to keep current): Buy groceries for the week
  Enter new description (or press Enter to keep current): Milk, eggs, bread, butter
  Task 1 updated successfully
"""


class DeleteCommand(Command):
    """Remove a task with confirmation."""

    def __init__(
        self, storage: TaskStorage, input_fn: Callable[[], str] | None = None
    ) -> None:
        self._storage = storage
        self._input_fn = input_fn or input

    @property
    def name(self) -> str:
        return "delete"

    @property
    def description(self) -> str:
        return "Remove a task (with confirmation)"

    def execute(self, *args: str) -> Result:
        """Delete a task after confirmation.

        Args:
            args[0]: task ID (required)
        """
        if len(args) < 1:
            return Result(
                success=False,
                message="Error: Task ID is required. Usage: delete <id>",
            )

        id_str = args[0]

        # Validate ID
        id_result = validate_id(id_str)
        if not id_result.success:
            return id_result

        task_id = id_result.data
        task = self._storage.get(task_id)

        if task is None:
            return Result(
                success=False,
                message="Error: Task not found. Use 'list' to see available tasks",
            )

        # Confirmation prompt
        try:
            response = self._input_fn()
            response = response.strip().lower()
        except (EOFError, KeyboardInterrupt):
            return Result(success=False, message="Deletion cancelled")

        if response in ("y", "yes"):
            return self._storage.delete(task_id)
        else:
            return Result(success=False, message="Deletion cancelled")

    def get_confirmation_prompt(self, task_id: int) -> str | None:
        """Get the confirmation prompt for a task.

        Returns the prompt string if task exists, None otherwise.
        """
        task = self._storage.get(task_id)
        if task is None:
            return None
        return f"Delete task {task_id}: '{task.title}'? (y/n): "

    def help(self) -> str:
        return """delete <id>

Remove a task after confirmation.

Arguments:
  id - Task ID to delete

Examples:
  delete 1
  # Prompts: Delete task 1: 'Buy groceries'? (y/n):
"""


class CompleteCommand(Command):
    """Toggle task completion status."""

    def __init__(self, storage: TaskStorage) -> None:
        self._storage = storage

    @property
    def name(self) -> str:
        return "complete"

    @property
    def description(self) -> str:
        return "Toggle completion status"

    def execute(self, *args: str) -> Result:
        """Toggle a task's completion status.

        Args:
            args[0]: task ID (required)
        """
        if len(args) < 1:
            return Result(
                success=False,
                message="Error: Task ID is required. Usage: complete <id>",
            )

        id_str = args[0]

        # Validate ID
        id_result = validate_id(id_str)
        if not id_result.success:
            return id_result

        return self._storage.toggle_complete(id_result.data)

    def help(self) -> str:
        return """complete <id>

Toggle a task's completion status.

If pending, marks as complete. If complete, marks as pending.

Arguments:
  id - Task ID to toggle

Examples:
  complete 1
  # Task 1 marked as complete
  complete 1
  # Task 1 marked as pending
"""


class HelpCommand(Command):
    """Show help information for commands."""

    def __init__(self, commands: dict[str, Command]) -> None:
        self._commands = commands

    @property
    def name(self) -> str:
        return "help"

    @property
    def description(self) -> str:
        return "Show help information"

    def execute(self, *args: str) -> Result:
        """Show help for a specific command or list all commands.

        Args:
            args[0]: command name (optional)
        """
        if args:
            cmd_name = args[0]
            if cmd_name in self._commands:
                return Result(
                    success=True,
                    message=self._commands[cmd_name].help(),
                )
            else:
                msg = f"Unknown command: '{cmd_name}'. Type 'help' for commands"
                return Result(success=False, message=msg)

        # General help
        lines = ["Available commands:"]
        lines.append("  add                        - Create a new task (interactive)")
        lines.append("  list [status]              - Show tasks (all/pending/done)")
        lines.append("  update <id>                - Modify a task (interactive)")
        lines.append("  delete <id>                - Remove a task (with confirmation)")
        lines.append("  complete <id>              - Toggle completion status")
        lines.append("  help [command]             - Show help information")
        lines.append("  exit                       - Exit the application")

        return Result(
            success=True,
            message="\n".join(lines),
        )

    def help(self) -> str:
        return """help [command]

Show help information.

Without arguments, lists all available commands.
With a command name, shows detailed help for that command.

Examples:
  help
  help add
  help list
"""
