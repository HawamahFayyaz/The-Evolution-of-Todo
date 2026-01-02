"""Unit tests for TaskStorage class.

[From]: specs/003-task-schema/tasks.md T015, T020, T027, T032, T038
"""

from datetime import UTC, datetime

from src.storage import TaskStorage


class TestTaskStorageAdd:
    """Tests for storage.add() method."""

    def test_add_task_returns_task(self) -> None:
        """Test adding a task returns the created task."""
        storage = TaskStorage()
        task = storage.add("Buy groceries")
        assert task.title == "Buy groceries"
        assert task.id == 1

    def test_add_task_with_description(self) -> None:
        """Test adding task with description."""
        storage = TaskStorage()
        task = storage.add("Buy groceries", "Milk, eggs, bread")
        assert task.description == "Milk, eggs, bread"

    def test_add_increments_id(self) -> None:
        """Test IDs are auto-incremented."""
        storage = TaskStorage()
        task1 = storage.add("Task 1")
        task2 = storage.add("Task 2")
        task3 = storage.add("Task 3")
        assert task1.id == 1
        assert task2.id == 2
        assert task3.id == 3

    def test_add_sets_timestamps(self) -> None:
        """Test timestamps are set on creation."""
        storage = TaskStorage()
        before = datetime.now(UTC)
        task = storage.add("Test")
        after = datetime.now(UTC)
        assert before <= task.created_at <= after
        assert task.created_at == task.updated_at

    def test_add_task_not_completed(self) -> None:
        """Test new tasks default to not completed."""
        storage = TaskStorage()
        task = storage.add("Test")
        assert task.completed is False


class TestTaskStorageGet:
    """Tests for storage.get() method."""

    def test_get_existing_task(self) -> None:
        """Test getting an existing task by ID."""
        storage = TaskStorage()
        added = storage.add("Test")
        retrieved = storage.get(added.id)
        assert retrieved is not None
        assert retrieved.id == added.id
        assert retrieved.title == "Test"

    def test_get_nonexistent_task(self) -> None:
        """Test getting a nonexistent task returns None."""
        storage = TaskStorage()
        result = storage.get(999)
        assert result is None

    def test_get_after_multiple_adds(self) -> None:
        """Test getting specific task after multiple adds."""
        storage = TaskStorage()
        storage.add("Task 1")
        storage.add("Task 2")
        storage.add("Task 3")
        retrieved = storage.get(2)
        assert retrieved is not None
        assert retrieved.title == "Task 2"


class TestTaskStorageListAll:
    """Tests for storage.list_all() method."""

    def test_list_empty_storage(self) -> None:
        """Test listing empty storage returns empty list."""
        storage = TaskStorage()
        tasks = storage.list_all()
        assert tasks == []

    def test_list_all_tasks(self) -> None:
        """Test listing all tasks."""
        storage = TaskStorage()
        storage.add("Task 1")
        storage.add("Task 2")
        storage.add("Task 3")
        tasks = storage.list_all()
        assert len(tasks) == 3

    def test_list_pending_tasks(self) -> None:
        """Test filtering by pending status."""
        storage = TaskStorage()
        storage.add("Task 1")
        task2 = storage.add("Task 2")
        storage.toggle_complete(task2.id)
        storage.add("Task 3")

        pending = storage.list_all(status="pending")
        assert len(pending) == 2
        assert all(not t.completed for t in pending)

    def test_list_completed_tasks(self) -> None:
        """Test filtering by completed status."""
        storage = TaskStorage()
        task1 = storage.add("Task 1")
        storage.add("Task 2")
        storage.toggle_complete(task1.id)

        completed = storage.list_all(status="completed")
        assert len(completed) == 1
        assert completed[0].id == task1.id

    def test_list_ordered_by_id(self) -> None:
        """Test tasks are ordered by ID."""
        storage = TaskStorage()
        storage.add("Third")
        storage.add("First")
        storage.add("Second")
        tasks = storage.list_all()
        assert tasks[0].id < tasks[1].id < tasks[2].id


class TestTaskStorageUpdate:
    """Tests for storage.update() method."""

    def test_update_title(self) -> None:
        """Test updating task title."""
        storage = TaskStorage()
        task = storage.add("Old title")
        result = storage.update(task.id, "New title")
        assert result.success is True
        assert storage.get(task.id).title == "New title"

    def test_update_title_and_description(self) -> None:
        """Test updating both title and description."""
        storage = TaskStorage()
        task = storage.add("Old title", "Old description")
        result = storage.update(task.id, "New title", "New description")
        assert result.success is True
        updated = storage.get(task.id)
        assert updated.title == "New title"
        assert updated.description == "New description"

    def test_update_preserves_description_when_none(self) -> None:
        """Test updating title only preserves existing description."""
        storage = TaskStorage()
        task = storage.add("Title", "Original description")
        storage.update(task.id, "New title", None)
        updated = storage.get(task.id)
        assert updated.description == "Original description"

    def test_update_nonexistent_task(self) -> None:
        """Test updating nonexistent task returns error."""
        storage = TaskStorage()
        result = storage.update(999, "Title")
        assert result.success is False
        assert "not found" in result.message.lower()

    def test_update_modifies_updated_at(self) -> None:
        """Test update modifies updated_at timestamp."""
        storage = TaskStorage()
        task = storage.add("Title")
        original_updated = task.updated_at
        storage.update(task.id, "New title")
        updated = storage.get(task.id)
        assert updated.updated_at >= original_updated


class TestTaskStorageDelete:
    """Tests for storage.delete() method."""

    def test_delete_existing_task(self) -> None:
        """Test deleting an existing task."""
        storage = TaskStorage()
        task = storage.add("Test")
        result = storage.delete(task.id)
        assert result.success is True
        assert storage.get(task.id) is None

    def test_delete_nonexistent_task(self) -> None:
        """Test deleting nonexistent task returns error."""
        storage = TaskStorage()
        result = storage.delete(999)
        assert result.success is False
        assert "not found" in result.message.lower()

    def test_delete_returns_deleted_task(self) -> None:
        """Test delete returns the deleted task in data."""
        storage = TaskStorage()
        task = storage.add("Test")
        result = storage.delete(task.id)
        assert result.data.title == "Test"

    def test_delete_does_not_affect_other_tasks(self) -> None:
        """Test deleting one task doesn't affect others."""
        storage = TaskStorage()
        task1 = storage.add("Task 1")
        task2 = storage.add("Task 2")
        task3 = storage.add("Task 3")
        storage.delete(task2.id)
        assert storage.get(task1.id) is not None
        assert storage.get(task3.id) is not None
        assert len(storage.list_all()) == 2


class TestTaskStorageToggleComplete:
    """Tests for storage.toggle_complete() method."""

    def test_toggle_pending_to_complete(self) -> None:
        """Test toggling pending task to completed."""
        storage = TaskStorage()
        task = storage.add("Test")
        result = storage.toggle_complete(task.id)
        assert result.success is True
        assert "complete" in result.message.lower()
        assert storage.get(task.id).completed is True

    def test_toggle_complete_to_pending(self) -> None:
        """Test toggling completed task back to pending."""
        storage = TaskStorage()
        task = storage.add("Test")
        storage.toggle_complete(task.id)  # Complete
        result = storage.toggle_complete(task.id)  # Back to pending
        assert result.success is True
        assert "pending" in result.message.lower()
        assert storage.get(task.id).completed is False

    def test_toggle_nonexistent_task(self) -> None:
        """Test toggling nonexistent task returns error."""
        storage = TaskStorage()
        result = storage.toggle_complete(999)
        assert result.success is False
        assert "not found" in result.message.lower()

    def test_toggle_modifies_updated_at(self) -> None:
        """Test toggle modifies updated_at timestamp."""
        storage = TaskStorage()
        task = storage.add("Test")
        original_updated = task.updated_at
        storage.toggle_complete(task.id)
        updated = storage.get(task.id)
        assert updated.updated_at >= original_updated


class TestTaskStorageCount:
    """Tests for storage.count() method."""

    def test_count_empty_storage(self) -> None:
        """Test count on empty storage."""
        storage = TaskStorage()
        total, pending, completed = storage.count()
        assert total == 0
        assert pending == 0
        assert completed == 0

    def test_count_all_pending(self) -> None:
        """Test count with all pending tasks."""
        storage = TaskStorage()
        storage.add("Task 1")
        storage.add("Task 2")
        total, pending, completed = storage.count()
        assert total == 2
        assert pending == 2
        assert completed == 0

    def test_count_mixed_status(self) -> None:
        """Test count with mixed statuses."""
        storage = TaskStorage()
        task1 = storage.add("Task 1")
        storage.add("Task 2")
        task3 = storage.add("Task 3")
        storage.toggle_complete(task1.id)
        storage.toggle_complete(task3.id)

        total, pending, completed = storage.count()
        assert total == 3
        assert pending == 1
        assert completed == 2
