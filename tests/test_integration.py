"""Integration tests for end-to-end CLI flows with menu-driven interface.

[From]: specs/003-task-schema/tasks.md T047, T048, T049
"""

from io import StringIO
from typing import Iterator

from src.commands import (
    AddCommand,
    CompleteCommand,
    DeleteCommand,
    ListCommand,
    UpdateCommand,
)
from src.main import MenuApp, run_menu
from src.storage import TaskStorage


def make_input_fn(responses: list[str]) -> tuple[Iterator[str], callable]:
    """Create an input function that returns responses in sequence."""
    it = iter(responses)

    def input_fn() -> str:
        return next(it)

    return it, input_fn


class TestAddListFlow:
    """Test add → list flow using command objects directly."""

    def test_add_then_list_shows_task(self) -> None:
        """Test that added task appears in list via interactive prompts."""
        storage = TaskStorage()
        _, input_fn = make_input_fn(["Buy groceries", "Milk, eggs"])
        add_cmd = AddCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        list_cmd = ListCommand(storage)

        # Add a task
        add_result = add_cmd.execute()
        assert add_result.success is True

        # List should show the task
        list_result = list_cmd.execute()
        assert "Buy groceries" in list_result.message
        has_full = "Milk, eggs" in list_result.message
        has_truncated = "Milk, e..." in list_result.message
        assert has_full or has_truncated

    def test_add_multiple_then_list(self) -> None:
        """Test adding multiple tasks then listing."""
        storage = TaskStorage()
        # Input for 3 tasks: title1, desc1, title2, desc2, title3, desc3
        _, input_fn = make_input_fn(["Task 1", "", "Task 2", "", "Task 3", ""])
        add_cmd = AddCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        list_cmd = ListCommand(storage)

        add_cmd.execute()
        add_cmd.execute()
        add_cmd.execute()

        list_result = list_cmd.execute()
        assert "Task 1" in list_result.message
        assert "Task 2" in list_result.message
        assert "Task 3" in list_result.message
        assert "3 tasks total" in list_result.message


class TestCompleteToggleFlow:
    """Test complete toggle flow."""

    def test_add_complete_list_shows_x(self) -> None:
        """Test completing task shows [x] in list."""
        storage = TaskStorage()
        _, input_fn = make_input_fn(["Test task", ""])
        add_cmd = AddCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        list_cmd = ListCommand(storage)
        complete_cmd = CompleteCommand(storage)

        add_cmd.execute()
        complete_result = complete_cmd.execute("1")
        assert "complete" in complete_result.message.lower()

        list_result = list_cmd.execute()
        assert "[x]" in list_result.message

    def test_toggle_complete_twice(self) -> None:
        """Test toggling complete twice returns to pending."""
        storage = TaskStorage()
        _, input_fn = make_input_fn(["Test task", ""])
        add_cmd = AddCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        complete_cmd = CompleteCommand(storage)

        add_cmd.execute()

        # First toggle - complete
        result1 = complete_cmd.execute("1")
        assert "complete" in result1.message.lower()
        assert storage.get(1).completed is True

        # Second toggle - back to pending
        result2 = complete_cmd.execute("1")
        assert "pending" in result2.message.lower()
        assert storage.get(1).completed is False

    def test_list_pending_after_complete(self) -> None:
        """Test filtering pending tasks after completing one."""
        storage = TaskStorage()
        _, input_fn = make_input_fn(["Pending task", "", "Completed task", ""])
        add_cmd = AddCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        list_cmd = ListCommand(storage)
        complete_cmd = CompleteCommand(storage)

        add_cmd.execute()
        add_cmd.execute()
        complete_cmd.execute("2")

        pending_result = list_cmd.execute("pending")
        assert "Pending task" in pending_result.message
        assert len(pending_result.data) == 1


class TestUpdateFlow:
    """Test update flow."""

    def test_add_update_list_shows_new_title(self) -> None:
        """Test updated task shows new title in list."""
        storage = TaskStorage()
        _, add_input_fn = make_input_fn(["Old title", ""])
        _, update_input_fn = make_input_fn(["New title", ""])
        add_cmd = AddCommand(storage, input_fn=add_input_fn, print_fn=lambda s: None)
        update_cmd = UpdateCommand(
            storage, input_fn=update_input_fn, print_fn=lambda s: None
        )
        list_cmd = ListCommand(storage)

        add_cmd.execute()
        update_cmd.execute("1")

        list_result = list_cmd.execute()
        assert "New title" in list_result.message
        assert "Old title" not in list_result.message

    def test_update_preserves_completion_status(self) -> None:
        """Test update doesn't change completion status."""
        storage = TaskStorage()
        _, add_input_fn = make_input_fn(["Task", ""])
        _, update_input_fn = make_input_fn(["Updated task", ""])
        add_cmd = AddCommand(storage, input_fn=add_input_fn, print_fn=lambda s: None)
        update_cmd = UpdateCommand(
            storage, input_fn=update_input_fn, print_fn=lambda s: None
        )
        complete_cmd = CompleteCommand(storage)

        add_cmd.execute()
        complete_cmd.execute("1")
        update_cmd.execute("1")

        assert storage.get(1).completed is True


class TestDeleteFlow:
    """Test delete flow."""

    def test_add_delete_list_empty(self) -> None:
        """Test deleting only task makes list empty."""
        storage = TaskStorage()

        _, add_input_fn = make_input_fn(["Test task", ""])
        delete_cmd = DeleteCommand(storage, input_fn=lambda: "y")
        add_cmd = AddCommand(storage, input_fn=add_input_fn, print_fn=lambda s: None)
        list_cmd = ListCommand(storage)

        add_cmd.execute()
        delete_cmd.execute("1")

        list_result = list_cmd.execute()
        assert "No tasks found" in list_result.message

    def test_delete_cancelled_keeps_task(self) -> None:
        """Test cancelled delete keeps the task."""
        storage = TaskStorage()

        _, add_input_fn = make_input_fn(["Test task", ""])
        delete_cmd = DeleteCommand(storage, input_fn=lambda: "n")
        add_cmd = AddCommand(storage, input_fn=add_input_fn, print_fn=lambda s: None)

        add_cmd.execute()
        delete_result = delete_cmd.execute("1")

        assert "cancelled" in delete_result.message.lower()
        assert storage.get(1) is not None


class TestErrorRecovery:
    """Test error recovery scenarios."""

    def test_invalid_command_then_valid(self) -> None:
        """Test system recovers after invalid command."""
        storage = TaskStorage()
        _, input_fn = make_input_fn(["Test", ""])
        add_cmd = AddCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        list_cmd = ListCommand(storage)
        complete_cmd = CompleteCommand(storage)

        # Invalid: complete without ID
        error_result = complete_cmd.execute()
        assert error_result.success is False

        # Valid: add task
        add_result = add_cmd.execute()
        assert add_result.success is True

        # Valid: list tasks
        list_result = list_cmd.execute()
        assert "Test" in list_result.message

    def test_nonexistent_id_then_valid(self) -> None:
        """Test recovery after referencing nonexistent ID."""
        storage = TaskStorage()
        _, input_fn = make_input_fn(["Real task", ""])
        add_cmd = AddCommand(storage, input_fn=input_fn, print_fn=lambda s: None)
        complete_cmd = CompleteCommand(storage)

        # Error: complete nonexistent task
        error_result = complete_cmd.execute("999")
        assert error_result.success is False
        assert "not found" in error_result.message.lower()

        # Valid: add and complete
        add_cmd.execute()
        complete_result = complete_cmd.execute("1")
        assert complete_result.success is True


class TestFullWorkflow:
    """Test complete workflow scenarios."""

    def test_full_crud_workflow(self) -> None:
        """Test create, read, update, complete, delete workflow."""
        storage = TaskStorage()

        _, add_input_fn = make_input_fn(["Original task", "Original description"])
        _, update_input_fn = make_input_fn(["Updated task", "Updated description"])
        add_cmd = AddCommand(storage, input_fn=add_input_fn, print_fn=lambda s: None)
        list_cmd = ListCommand(storage)
        update_cmd = UpdateCommand(
            storage, input_fn=update_input_fn, print_fn=lambda s: None
        )
        complete_cmd = CompleteCommand(storage)
        delete_cmd = DeleteCommand(storage, input_fn=lambda: "y")

        # Create
        add_result = add_cmd.execute()
        assert add_result.success is True

        # Read
        list_result = list_cmd.execute()
        assert "Original task" in list_result.message

        # Update
        update_result = update_cmd.execute("1")
        assert update_result.success is True

        # Verify update
        list_result = list_cmd.execute()
        assert "Updated task" in list_result.message

        # Complete
        complete_result = complete_cmd.execute("1")
        assert "complete" in complete_result.message.lower()

        # Delete
        delete_result = delete_cmd.execute("1")
        assert delete_result.success is True

        # Verify empty
        final_list = list_cmd.execute()
        assert "No tasks found" in final_list.message


class TestMenuIntegration:
    """Test menu-driven interface integration."""

    def test_menu_add_list_exit(self) -> None:
        """Test menu with add, list, exit flow."""
        storage = TaskStorage()
        # Menu choices: 1 (add), title, desc, 2 (list), 7 (exit)
        input_data = "1\nBuy groceries\nMilk and eggs\n2\n7\n"
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        assert "SUCCESS: Task created successfully!" in output
        assert "Buy groceries" in output
        assert "Goodbye!" in output

    def test_menu_shows_welcome_banner(self) -> None:
        """Test menu shows welcome banner on start."""
        storage = TaskStorage()
        input_data = "7\n"  # Just exit
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        assert "WELCOME TO TODO CLI" in output
        assert "TODO APPLICATION" in output
        assert "1. Add Task" in output
        assert "7. Exit" in output

    def test_menu_handles_invalid_choice(self) -> None:
        """Test menu handles invalid choice gracefully."""
        storage = TaskStorage()
        input_data = "invalid\n8\n7\n"
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        assert "ERROR: Invalid choice" in output
        assert "Goodbye!" in output

    def test_menu_add_complete_flow(self) -> None:
        """Test adding task then marking it complete via menu."""
        storage = TaskStorage()
        # 1: add, title, desc, 5: mark complete, task_id, 7: exit
        input_data = "1\nTest task\n\n5\n1\n7\n"
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        assert "Task created successfully" in output
        assert "Task marked as complete" in output
        assert storage.get(1).completed is True

    def test_menu_add_update_flow(self) -> None:
        """Test adding task then updating it via menu."""
        storage = TaskStorage()
        # 1: add, title, desc, 3: update, task_id, new_title, new_desc, 7: exit
        input_data = "1\nOld title\nOld desc\n3\n1\nNew title\nNew desc\n7\n"
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        assert "Task created successfully" in output
        assert "Task updated successfully" in output
        assert storage.get(1).title == "New title"
        assert storage.get(1).description == "New desc"

    def test_menu_add_delete_flow(self) -> None:
        """Test adding task then deleting it via menu."""
        storage = TaskStorage()
        # 1: add, title, desc, 4: delete, task_id, confirm, 7: exit
        input_data = "1\nTest task\n\n4\n1\ny\n7\n"
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        assert "Task created successfully" in output
        assert "Task deleted successfully" in output
        assert storage.get(1) is None

    def test_menu_delete_cancelled(self) -> None:
        """Test cancelling deletion via menu."""
        storage = TaskStorage()
        # 1: add, title, desc, 4: delete, task_id, cancel, 7: exit
        input_data = "1\nTest task\n\n4\n1\nn\n7\n"
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        assert "Deletion cancelled" in output
        assert storage.get(1) is not None

    def test_menu_list_empty(self) -> None:
        """Test listing when no tasks exist."""
        storage = TaskStorage()
        input_data = "2\n7\n"
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        assert "No tasks found" in output
        assert "empty" in output

    def test_menu_mark_incomplete_flow(self) -> None:
        """Test marking a completed task as incomplete."""
        storage = TaskStorage()
        # 1: add, 5: complete, 6: incomplete, 7: exit
        input_data = "1\nTest task\n\n5\n1\n6\n1\n7\n"
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        assert "Task marked as complete" in output
        assert "Task marked as incomplete" in output
        assert storage.get(1).completed is False

    def test_menu_handles_eof(self) -> None:
        """Test menu handles EOF gracefully."""
        storage = TaskStorage()
        input_data = "1\n"  # EOF after add command starts
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        # Should handle EOF gracefully
        assert "Goodbye!" in output

    def test_menu_multi_word_input(self) -> None:
        """Test menu handles multi-word input naturally."""
        storage = TaskStorage()
        # Multi-word title and description
        input_data = "1\nBuy groceries for the week\nGet milk, eggs, and bread\n2\n7\n"
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        assert "Buy groceries for the week" in output
        assert storage.get(1).title == "Buy groceries for the week"
        assert storage.get(1).description == "Get milk, eggs, and bread"

    def test_menu_full_workflow(self) -> None:
        """Test complete CRUD workflow via menu."""
        storage = TaskStorage()
        # Add -> List -> Complete -> Update -> Delete
        input_data = (
            "1\nOriginal task\nOriginal desc\n"  # Add
            "2\n"  # List
            "5\n1\n"  # Complete
            "3\n1\nUpdated task\nUpdated desc\n"  # Update
            "4\n1\ny\n"  # Delete with confirm
            "2\n"  # List (empty)
            "7\n"  # Exit
        )
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        assert "Task created successfully" in output
        assert "YOUR TASKS" in output
        assert "Task marked as complete" in output
        assert "Task updated successfully" in output
        assert "Task deleted successfully" in output
        assert "No tasks found" in output

    def test_menu_shows_task_count(self) -> None:
        """Test list shows task count summary."""
        storage = TaskStorage()
        # Add 2 tasks, complete 1, list
        input_data = "1\nTask 1\n\n1\nTask 2\n\n5\n1\n2\n7\n"
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        assert "2 task(s)" in output
        assert "1 pending" in output
        assert "1 completed" in output


class TestMenuAppClass:
    """Test MenuApp class directly."""

    def test_menu_app_initialization(self) -> None:
        """Test MenuApp initializes with defaults."""
        app = MenuApp()
        assert app.storage is not None
        assert app.input_stream is not None
        assert app.output_stream is not None

    def test_menu_app_with_custom_storage(self) -> None:
        """Test MenuApp accepts custom storage."""
        storage = TaskStorage()
        storage.add("Pre-existing task")

        input_data = "2\n7\n"
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        app = MenuApp(storage, input_stream, output_stream)
        app.run()

        output = output_stream.getvalue()
        assert "Pre-existing task" in output

    def test_add_task_empty_title_error(self) -> None:
        """Test add task shows error for empty title."""
        storage = TaskStorage()
        input_data = "1\n\n7\n"  # Empty title
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        assert "ERROR: Title cannot be empty" in output

    def test_update_nonexistent_task(self) -> None:
        """Test update shows error for nonexistent task."""
        storage = TaskStorage()
        storage.add("Test task")
        input_data = "3\n999\n7\n"  # Nonexistent ID
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        assert "ERROR: Task not found" in output

    def test_complete_already_complete_task(self) -> None:
        """Test marking complete shows no incomplete tasks when all are done."""
        storage = TaskStorage()
        task = storage.add("Test task")
        storage.toggle_complete(task.id)

        input_data = "5\n7\n"  # No task ID needed since list is empty
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        assert "No incomplete tasks" in output

    def test_incomplete_already_incomplete_task(self) -> None:
        """Test marking already incomplete task shows message."""
        storage = TaskStorage()
        storage.add("Test task")

        input_data = "6\n1\n7\n"  # No completed tasks exist
        input_stream = StringIO(input_data)
        output_stream = StringIO()

        run_menu(storage, input_stream, output_stream)

        output = output_stream.getvalue()
        assert "No completed tasks" in output
