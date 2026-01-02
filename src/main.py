"""Main entry point for Todo Console App with menu-driven interface.

[From]: specs/003-task-schema/plan.md, specs/003-task-schema/contracts/cli-interface.md
"""

import sys
from typing import TextIO

from src.storage import TaskStorage
from src.utils import validate_description, validate_id, validate_title


class MenuApp:
    """Menu-driven todo application."""

    def __init__(
        self,
        storage: TaskStorage | None = None,
        input_stream: TextIO | None = None,
        output_stream: TextIO | None = None,
    ) -> None:
        """Initialize menu application.

        Args:
            storage: Optional TaskStorage instance (creates new if None)
            input_stream: Optional input stream for testing (defaults to stdin)
            output_stream: Optional output stream for testing (defaults to stdout)
        """
        self.storage = storage or TaskStorage()
        self.input_stream = input_stream or sys.stdin
        self.output_stream = output_stream or sys.stdout

    def write(self, text: str = "") -> None:
        """Write text with newline to output stream."""
        self.output_stream.write(text + "\n")
        self.output_stream.flush()

    def write_inline(self, text: str) -> None:
        """Write text without newline to output stream."""
        self.output_stream.write(text)
        self.output_stream.flush()

    def read_input(self, prompt: str = "") -> str:
        """Read input with optional prompt."""
        if prompt:
            self.write_inline(prompt)
        line = self.input_stream.readline()
        if not line:
            raise EOFError()
        return line.rstrip("\n")

    def show_welcome(self) -> None:
        """Display welcome banner."""
        self.write("=" * 50)
        self.write("       WELCOME TO TODO CLI")
        self.write("    Phase I: In-Memory Todo App")
        self.write("=" * 50)
        self.write()

    def show_menu(self) -> None:
        """Display main menu."""
        self.write()
        self.write("=" * 50)
        self.write("           TODO APPLICATION")
        self.write("=" * 50)
        self.write("1. Add Task")
        self.write("2. List All Tasks")
        self.write("3. Update Task")
        self.write("4. Delete Task")
        self.write("5. Mark Complete")
        self.write("6. Mark Incomplete")
        self.write("7. Exit")
        self.write("=" * 50)

    def add_task(self) -> None:
        """Interactive task creation."""
        self.write()
        self.write("--- Add New Task ---")

        title = self.read_input("Enter task title: ").strip()

        if not title:
            self.write("ERROR: Title cannot be empty.")
            return

        # Validate title
        title_result = validate_title(title)
        if not title_result.success:
            self.write(f"ERROR: {title_result.message}")
            return

        description = self.read_input(
            "Enter task description (optional, press Enter to skip): "
        ).strip()

        # Validate description
        if description:
            desc_result = validate_description(description)
            if not desc_result.success:
                self.write(f"ERROR: {desc_result.message}")
                return

        task = self.storage.add(title, description)
        self.write(f"SUCCESS: Task created successfully! (ID: {task.id})")

    def list_tasks(self) -> None:
        """Display all tasks in formatted list."""
        tasks = self.storage.list_all()

        if not tasks:
            self.write()
            self.write("No tasks found. Your todo list is empty!")
            return

        self.write()
        self.write("=" * 60)
        self.write(f"{'YOUR TASKS':^60}")
        self.write("=" * 60)

        for task in tasks:
            status_icon = "[x]" if task.completed else "[ ]"
            status_text = "Complete" if task.completed else "Incomplete"

            self.write()
            self.write(f"{status_icon} Task ID: {task.id}")
            self.write(f"    Title: {task.title}")
            if task.description:
                self.write(f"    Description: {task.description}")
            self.write(f"    Status: {status_text}")
            self.write(f"    Created: {task.created_at.strftime('%Y-%m-%d %H:%M')}")

        self.write()
        self.write("=" * 60)
        total, pending, completed = self.storage.count()
        self.write(f"Total: {total} task(s) | {pending} pending | {completed} completed")

    def update_task(self) -> None:
        """Interactive task update."""
        self.write()
        self.write("--- Update Task ---")

        # Show current tasks first
        tasks = self.storage.list_all()
        if not tasks:
            self.write("No tasks to update.")
            return

        # Simple list for reference
        for task in tasks:
            self.write(f"  {task.id}. {task.title}")

        task_id_str = self.read_input("\nEnter task ID to update: ").strip()

        # Validate ID
        id_result = validate_id(task_id_str)
        if not id_result.success:
            self.write(f"ERROR: {id_result.message}")
            return

        task_id = id_result.data

        # Get current task
        current_task = self.storage.get(task_id)
        if current_task is None:
            self.write("ERROR: Task not found.")
            return

        self.write(f"\nCurrent Title: {current_task.title}")
        self.write(f"Current Description: {current_task.description or '(none)'}")

        new_title = self.read_input(
            "\nEnter new title (or press Enter to keep current): "
        ).strip()
        new_description = self.read_input(
            "Enter new description (or press Enter to keep current): "
        ).strip()

        # Use current values if not provided
        final_title = new_title if new_title else current_task.title
        final_description = (
            new_description if new_description else current_task.description
        )

        # Validate new title
        title_result = validate_title(final_title)
        if not title_result.success:
            self.write(f"ERROR: {title_result.message}")
            return

        # Validate new description
        if final_description:
            desc_result = validate_description(final_description)
            if not desc_result.success:
                self.write(f"ERROR: {desc_result.message}")
                return

        result = self.storage.update(task_id, final_title, final_description)
        if result.success:
            self.write("SUCCESS: Task updated successfully!")
        else:
            self.write(f"ERROR: {result.message}")

    def delete_task(self) -> None:
        """Interactive task deletion with confirmation."""
        self.write()
        self.write("--- Delete Task ---")

        # Show tasks
        tasks = self.storage.list_all()
        if not tasks:
            self.write("No tasks to delete.")
            return

        for task in tasks:
            self.write(f"  {task.id}. {task.title}")

        task_id_str = self.read_input("\nEnter task ID to delete: ").strip()

        # Validate ID
        id_result = validate_id(task_id_str)
        if not id_result.success:
            self.write(f"ERROR: {id_result.message}")
            return

        task_id = id_result.data

        # Get task for confirmation
        task = self.storage.get(task_id)
        if task is None:
            self.write("ERROR: Task not found.")
            return

        confirm = self.read_input(f"Delete '{task.title}'? (y/n): ").strip().lower()

        if confirm in ("y", "yes"):
            result = self.storage.delete(task_id)
            if result.success:
                self.write("SUCCESS: Task deleted successfully!")
            else:
                self.write(f"ERROR: {result.message}")
        else:
            self.write("Deletion cancelled.")

    def mark_complete(self) -> None:
        """Mark task as complete."""
        self.write()
        self.write("--- Mark Task Complete ---")

        # Show incomplete tasks
        tasks = [t for t in self.storage.list_all() if not t.completed]
        if not tasks:
            self.write("No incomplete tasks.")
            return

        for task in tasks:
            self.write(f"  {task.id}. {task.title}")

        task_id_str = self.read_input("\nEnter task ID to mark complete: ").strip()

        # Validate ID
        id_result = validate_id(task_id_str)
        if not id_result.success:
            self.write(f"ERROR: {id_result.message}")
            return

        task_id = id_result.data

        # Check task exists and is not already complete
        task = self.storage.get(task_id)
        if task is None:
            self.write("ERROR: Task not found.")
            return

        if task.completed:
            self.write("Task is already complete.")
            return

        result = self.storage.toggle_complete(task_id)
        if result.success:
            self.write("SUCCESS: Task marked as complete!")
        else:
            self.write(f"ERROR: {result.message}")

    def mark_incomplete(self) -> None:
        """Mark task as incomplete."""
        self.write()
        self.write("--- Mark Task Incomplete ---")

        # Show completed tasks
        tasks = [t for t in self.storage.list_all() if t.completed]
        if not tasks:
            self.write("No completed tasks.")
            return

        for task in tasks:
            self.write(f"  {task.id}. {task.title}")

        task_id_str = self.read_input("\nEnter task ID to mark incomplete: ").strip()

        # Validate ID
        id_result = validate_id(task_id_str)
        if not id_result.success:
            self.write(f"ERROR: {id_result.message}")
            return

        task_id = id_result.data

        # Check task exists and is complete
        task = self.storage.get(task_id)
        if task is None:
            self.write("ERROR: Task not found.")
            return

        if not task.completed:
            self.write("Task is already incomplete.")
            return

        result = self.storage.toggle_complete(task_id)
        if result.success:
            self.write("SUCCESS: Task marked as incomplete!")
        else:
            self.write(f"ERROR: {result.message}")

    def run(self) -> None:
        """Main application loop."""
        self.show_welcome()

        while True:
            try:
                self.show_menu()
                choice = self.read_input("Enter your choice (1-7): ").strip()

                if choice == "1":
                    self.add_task()
                elif choice == "2":
                    self.list_tasks()
                elif choice == "3":
                    self.update_task()
                elif choice == "4":
                    self.delete_task()
                elif choice == "5":
                    self.mark_complete()
                elif choice == "6":
                    self.mark_incomplete()
                elif choice == "7":
                    self.write()
                    self.write("Goodbye! Thanks for using Todo CLI.")
                    break
                else:
                    self.write("ERROR: Invalid choice. Please enter 1-7.")

            except KeyboardInterrupt:
                self.write()
                self.write("Goodbye!")
                break
            except EOFError:
                self.write("Goodbye!")
                break


def run_menu(
    storage: TaskStorage | None = None,
    input_stream: TextIO | None = None,
    output_stream: TextIO | None = None,
) -> None:
    """Run the menu-driven application.

    Args:
        storage: Optional TaskStorage instance (creates new if None)
        input_stream: Optional input stream for testing (defaults to stdin)
        output_stream: Optional output stream for testing (defaults to stdout)
    """
    app = MenuApp(storage, input_stream, output_stream)
    app.run()


def main() -> None:
    """Main entry point."""
    run_menu()


if __name__ == "__main__":
    main()
