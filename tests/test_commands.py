"""Unit tests for command handlers.

[From]: specs/003-task-schema/tasks.md T016, T021, T028, T033, T039, T043
"""

from typing import Iterator

from src.commands import (
    AddCommand,
    CompleteCommand,
    DeleteCommand,
    HelpCommand,
    ListCommand,
    UpdateCommand,
)
from src.storage import TaskStorage


def make_input_fn(responses: list[str]) -> tuple[Iterator[str], callable]:
    """Create an input function that returns responses in sequence."""
    it = iter(responses)

    def input_fn() -> str:
        return next(it)

    return it, input_fn


class TestAddCommand:
    """Tests for AddCommand."""

    def test_add_with_title_only(self) -> None:
        """Test adding task with title only via interactive prompt."""
        storage = TaskStorage()
        _, input_fn = make_input_fn(["Buy groceries", ""])
        cmd = AddCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        result = cmd.execute()
        assert result.success is True
        assert "created successfully" in result.message
        assert result.data.title == "Buy groceries"

    def test_add_with_title_and_description(self) -> None:
        """Test adding task with title and description via interactive prompt."""
        storage = TaskStorage()
        _, input_fn = make_input_fn(["Buy groceries", "Milk, eggs, bread"])
        cmd = AddCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        result = cmd.execute()
        assert result.success is True
        assert result.data.description == "Milk, eggs, bread"

    def test_add_with_multi_word_title(self) -> None:
        """Test adding task with multi-word title works naturally."""
        storage = TaskStorage()
        _, input_fn = make_input_fn(["Buy groceries for the week", ""])
        cmd = AddCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        result = cmd.execute()
        assert result.success is True
        assert result.data.title == "Buy groceries for the week"

    def test_add_with_multi_word_description(self) -> None:
        """Test adding task with multi-word description works naturally."""
        storage = TaskStorage()
        _, input_fn = make_input_fn(["Shopping", "Get milk, eggs, and bread from the store"])
        cmd = AddCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        result = cmd.execute()
        assert result.success is True
        assert result.data.description == "Get milk, eggs, and bread from the store"

    def test_add_empty_title(self) -> None:
        """Test add with empty title fails."""
        storage = TaskStorage()
        _, input_fn = make_input_fn(["", ""])
        cmd = AddCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        result = cmd.execute()
        assert result.success is False
        assert "required" in result.message.lower()

    def test_add_title_too_long(self) -> None:
        """Test add with title over 200 chars fails."""
        storage = TaskStorage()
        _, input_fn = make_input_fn(["A" * 201, ""])
        cmd = AddCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        result = cmd.execute()
        assert result.success is False
        assert "1-200" in result.message

    def test_add_description_too_long(self) -> None:
        """Test add with description over 1000 chars fails."""
        storage = TaskStorage()
        _, input_fn = make_input_fn(["Title", "A" * 1001])
        cmd = AddCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        result = cmd.execute()
        assert result.success is False
        assert "0-1000" in result.message

    def test_add_returns_task_id_in_message(self) -> None:
        """Test success message includes task ID."""
        storage = TaskStorage()
        _, input_fn = make_input_fn(["Test", ""])
        cmd = AddCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        result = cmd.execute()
        assert "Task 1" in result.message

    def test_add_cancelled_on_interrupt(self) -> None:
        """Test add is cancelled on keyboard interrupt."""
        storage = TaskStorage()

        def interrupt_input() -> str:
            raise KeyboardInterrupt()

        cmd = AddCommand(storage, input_fn=interrupt_input, print_fn=lambda s: None)
        result = cmd.execute()
        assert result.success is False
        assert "cancelled" in result.message.lower()

    def test_add_help_text(self) -> None:
        """Test help text is informative."""
        storage = TaskStorage()
        cmd = AddCommand(storage)
        help_text = cmd.help()
        assert "add" in help_text
        assert "title" in help_text.lower()
        assert "Example" in help_text


class TestListCommand:
    """Tests for ListCommand."""

    def test_list_empty(self) -> None:
        """Test listing empty storage."""
        storage = TaskStorage()
        cmd = ListCommand(storage)
        result = cmd.execute()
        assert result.success is True
        assert "No tasks found" in result.message

    def test_list_all_tasks(self) -> None:
        """Test listing all tasks."""
        storage = TaskStorage()
        storage.add("Task 1")
        storage.add("Task 2")
        cmd = ListCommand(storage)
        result = cmd.execute()
        assert result.success is True
        assert "Task 1" in result.message
        assert "Task 2" in result.message
        assert "2 tasks total" in result.message

    def test_list_pending_only(self) -> None:
        """Test listing only pending tasks."""
        storage = TaskStorage()
        storage.add("Pending task")
        task2 = storage.add("Completed task")
        storage.toggle_complete(task2.id)

        cmd = ListCommand(storage)
        result = cmd.execute("pending")
        assert result.success is True
        assert "Pending task" in result.message
        assert "Completed task" not in result.message

    def test_list_completed_only(self) -> None:
        """Test listing only completed tasks."""
        storage = TaskStorage()
        storage.add("Pending task")
        task2 = storage.add("Completed task")
        storage.toggle_complete(task2.id)

        cmd = ListCommand(storage)
        result = cmd.execute("completed")
        assert result.success is True
        assert "Completed task" in result.message
        # Pending task should not be in the result - check by looking at data
        assert len(result.data) == 1
        assert result.data[0].title == "Completed task"

    def test_list_with_all_filter(self) -> None:
        """Test 'all' filter shows all tasks."""
        storage = TaskStorage()
        storage.add("Task 1")
        task2 = storage.add("Task 2")
        storage.toggle_complete(task2.id)

        cmd = ListCommand(storage)
        result = cmd.execute("all")
        assert result.success is True
        assert len(result.data) == 2

    def test_list_invalid_status(self) -> None:
        """Test invalid status filter."""
        storage = TaskStorage()
        cmd = ListCommand(storage)
        result = cmd.execute("invalid")
        assert result.success is False
        assert "Invalid status" in result.message

    def test_list_shows_status_indicator(self) -> None:
        """Test list shows [ ] and [x] indicators."""
        storage = TaskStorage()
        storage.add("Pending")
        task2 = storage.add("Done")
        storage.toggle_complete(task2.id)

        cmd = ListCommand(storage)
        result = cmd.execute()
        assert "[ ]" in result.message
        assert "[x]" in result.message

    def test_list_shows_summary(self) -> None:
        """Test list shows summary line."""
        storage = TaskStorage()
        storage.add("Task 1")
        task2 = storage.add("Task 2")
        storage.toggle_complete(task2.id)

        cmd = ListCommand(storage)
        result = cmd.execute()
        assert "2 tasks total" in result.message
        assert "1 pending" in result.message
        assert "1 completed" in result.message

    def test_list_help_text(self) -> None:
        """Test help text is informative."""
        storage = TaskStorage()
        cmd = ListCommand(storage)
        help_text = cmd.help()
        assert "list" in help_text
        assert "pending" in help_text.lower()
        assert "completed" in help_text.lower()


class TestUpdateCommand:
    """Tests for UpdateCommand."""

    def test_update_title(self) -> None:
        """Test updating task title via interactive prompt."""
        storage = TaskStorage()
        storage.add("Old title")
        _, input_fn = make_input_fn(["New title", ""])
        cmd = UpdateCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        result = cmd.execute("1")
        assert result.success is True
        assert "updated successfully" in result.message
        assert storage.get(1).title == "New title"

    def test_update_title_and_description(self) -> None:
        """Test updating both title and description via interactive prompt."""
        storage = TaskStorage()
        storage.add("Old title", "Old desc")
        _, input_fn = make_input_fn(["New title", "New desc"])
        cmd = UpdateCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        result = cmd.execute("1")
        assert result.success is True
        updated = storage.get(1)
        assert updated.title == "New title"
        assert updated.description == "New desc"

    def test_update_with_multi_word_title(self) -> None:
        """Test updating task with multi-word title works naturally."""
        storage = TaskStorage()
        storage.add("Old title")
        _, input_fn = make_input_fn(["Call mom tonight about dinner", ""])
        cmd = UpdateCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        result = cmd.execute("1")
        assert result.success is True
        assert storage.get(1).title == "Call mom tonight about dinner"

    def test_update_keep_current_title(self) -> None:
        """Test pressing Enter keeps current title."""
        storage = TaskStorage()
        storage.add("Original title", "Original desc")
        _, input_fn = make_input_fn(["", "New description"])
        cmd = UpdateCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        result = cmd.execute("1")
        assert result.success is True
        updated = storage.get(1)
        assert updated.title == "Original title"
        assert updated.description == "New description"

    def test_update_keep_current_description(self) -> None:
        """Test pressing Enter keeps current description."""
        storage = TaskStorage()
        storage.add("Original title", "Original desc")
        _, input_fn = make_input_fn(["New title", ""])
        cmd = UpdateCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        result = cmd.execute("1")
        assert result.success is True
        updated = storage.get(1)
        assert updated.title == "New title"
        assert updated.description == "Original desc"

    def test_update_no_arguments(self) -> None:
        """Test update with no arguments fails."""
        storage = TaskStorage()
        cmd = UpdateCommand(storage)
        result = cmd.execute()
        assert result.success is False
        assert "required" in result.message.lower()

    def test_update_invalid_id(self) -> None:
        """Test update with invalid ID."""
        storage = TaskStorage()
        cmd = UpdateCommand(storage)
        result = cmd.execute("abc")
        assert result.success is False
        assert "positive number" in result.message.lower()

    def test_update_nonexistent_id(self) -> None:
        """Test update with nonexistent ID."""
        storage = TaskStorage()
        cmd = UpdateCommand(storage)
        result = cmd.execute("999")
        assert result.success is False
        assert "not found" in result.message.lower()

    def test_update_cancelled_on_interrupt(self) -> None:
        """Test update is cancelled on keyboard interrupt."""
        storage = TaskStorage()
        storage.add("Test task")

        def interrupt_input() -> str:
            raise KeyboardInterrupt()

        cmd = UpdateCommand(storage, input_fn=interrupt_input, print_fn=lambda s: None)
        result = cmd.execute("1")
        assert result.success is False
        assert "cancelled" in result.message.lower()

    def test_update_help_text(self) -> None:
        """Test help text is informative."""
        storage = TaskStorage()
        cmd = UpdateCommand(storage)
        help_text = cmd.help()
        assert "update" in help_text
        assert "<id>" in help_text


class TestDeleteCommand:
    """Tests for DeleteCommand."""

    def test_delete_with_confirmation_yes(self) -> None:
        """Test deleting task with 'y' confirmation."""
        storage = TaskStorage()
        storage.add("Test task")
        cmd = DeleteCommand(storage, input_fn=lambda: "y")
        result = cmd.execute("1")
        assert result.success is True
        assert "deleted successfully" in result.message
        assert storage.get(1) is None

    def test_delete_with_confirmation_yes_full(self) -> None:
        """Test deleting task with 'yes' confirmation."""
        storage = TaskStorage()
        storage.add("Test task")
        cmd = DeleteCommand(storage, input_fn=lambda: "yes")
        result = cmd.execute("1")
        assert result.success is True

    def test_delete_with_confirmation_no(self) -> None:
        """Test cancelling deletion with 'n'."""
        storage = TaskStorage()
        storage.add("Test task")
        cmd = DeleteCommand(storage, input_fn=lambda: "n")
        result = cmd.execute("1")
        assert result.success is False
        assert "cancelled" in result.message.lower()
        assert storage.get(1) is not None

    def test_delete_no_arguments(self) -> None:
        """Test delete with no arguments fails."""
        storage = TaskStorage()
        cmd = DeleteCommand(storage, input_fn=lambda: "y")
        result = cmd.execute()
        assert result.success is False
        assert "required" in result.message.lower()

    def test_delete_invalid_id(self) -> None:
        """Test delete with invalid ID."""
        storage = TaskStorage()
        cmd = DeleteCommand(storage, input_fn=lambda: "y")
        result = cmd.execute("abc")
        assert result.success is False
        assert "positive number" in result.message.lower()

    def test_delete_nonexistent_id(self) -> None:
        """Test delete with nonexistent ID."""
        storage = TaskStorage()
        cmd = DeleteCommand(storage, input_fn=lambda: "y")
        result = cmd.execute("999")
        assert result.success is False
        assert "not found" in result.message.lower()

    def test_delete_confirmation_prompt(self) -> None:
        """Test confirmation prompt format."""
        storage = TaskStorage()
        storage.add("Test task")
        cmd = DeleteCommand(storage, input_fn=lambda: "n")
        prompt = cmd.get_confirmation_prompt(1)
        assert prompt is not None
        assert "Test task" in prompt
        assert "(y/n)" in prompt

    def test_delete_help_text(self) -> None:
        """Test help text is informative."""
        storage = TaskStorage()
        cmd = DeleteCommand(storage, input_fn=lambda: "n")
        help_text = cmd.help()
        assert "delete" in help_text
        assert "confirmation" in help_text.lower()


class TestCompleteCommand:
    """Tests for CompleteCommand."""

    def test_complete_pending_task(self) -> None:
        """Test completing a pending task."""
        storage = TaskStorage()
        storage.add("Test task")
        cmd = CompleteCommand(storage)
        result = cmd.execute("1")
        assert result.success is True
        assert "complete" in result.message.lower()
        assert storage.get(1).completed is True

    def test_complete_completed_task(self) -> None:
        """Test toggling completed task back to pending."""
        storage = TaskStorage()
        task = storage.add("Test task")
        storage.toggle_complete(task.id)

        cmd = CompleteCommand(storage)
        result = cmd.execute("1")
        assert result.success is True
        assert "pending" in result.message.lower()
        assert storage.get(1).completed is False

    def test_complete_no_arguments(self) -> None:
        """Test complete with no arguments fails."""
        storage = TaskStorage()
        cmd = CompleteCommand(storage)
        result = cmd.execute()
        assert result.success is False
        assert "required" in result.message.lower()

    def test_complete_invalid_id(self) -> None:
        """Test complete with invalid ID."""
        storage = TaskStorage()
        cmd = CompleteCommand(storage)
        result = cmd.execute("abc")
        assert result.success is False
        assert "positive number" in result.message.lower()

    def test_complete_nonexistent_id(self) -> None:
        """Test complete with nonexistent ID."""
        storage = TaskStorage()
        cmd = CompleteCommand(storage)
        result = cmd.execute("999")
        assert result.success is False
        assert "not found" in result.message.lower()

    def test_complete_help_text(self) -> None:
        """Test help text is informative."""
        storage = TaskStorage()
        cmd = CompleteCommand(storage)
        help_text = cmd.help()
        assert "complete" in help_text
        assert "toggle" in help_text.lower()


class TestHelpCommand:
    """Tests for HelpCommand."""

    def test_help_general(self) -> None:
        """Test general help lists all commands."""
        storage = TaskStorage()
        commands: dict[str, object] = {
            "add": AddCommand(storage),
            "list": ListCommand(storage),
        }
        cmd = HelpCommand(commands)
        result = cmd.execute()
        assert result.success is True
        assert "Available commands:" in result.message
        assert "add" in result.message
        assert "list" in result.message
        assert "exit" in result.message

    def test_help_specific_command(self) -> None:
        """Test help for specific command."""
        storage = TaskStorage()
        commands: dict[str, object] = {"add": AddCommand(storage)}
        cmd = HelpCommand(commands)
        result = cmd.execute("add")
        assert result.success is True
        assert "add" in result.message
        assert "Example" in result.message

    def test_help_unknown_command(self) -> None:
        """Test help for unknown command."""
        commands: dict[str, object] = {}
        cmd = HelpCommand(commands)
        result = cmd.execute("unknown")
        assert result.success is False
        assert "Unknown command" in result.message

    def test_help_help(self) -> None:
        """Test help text for help command."""
        commands: dict[str, object] = {}
        cmd = HelpCommand(commands)
        help_text = cmd.help()
        assert "help" in help_text
        assert "command" in help_text.lower()
