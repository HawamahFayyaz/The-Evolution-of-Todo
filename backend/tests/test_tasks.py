"""Tests for Task CRUD API endpoints."""

import pytest
from fastapi.testclient import TestClient

from tests.conftest import auth_header, create_jwt_token


class TestListTasks:
    """Tests for GET /api/tasks endpoint."""

    def test_list_tasks_requires_auth(self, client: TestClient) -> None:
        """Unauthenticated request returns 401."""
        response = client.get("/api/tasks")
        assert response.status_code == 401

    def test_list_tasks_empty(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Returns empty list when no tasks exist."""
        response = client.get("/api/tasks", headers=auth_header(valid_token))
        assert response.status_code == 200
        data = response.json()
        assert data["tasks"] == []
        assert data["total"] == 0

    def test_list_tasks_returns_user_tasks(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Returns tasks created by the authenticated user."""
        # Create a task
        client.post(
            "/api/tasks",
            headers=auth_header(valid_token),
            json={"title": "Test task"},
        )

        response = client.get("/api/tasks", headers=auth_header(valid_token))
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["tasks"][0]["title"] == "Test task"

    def test_list_tasks_filters_by_completed(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Filter tasks by completion status."""
        # Create completed and incomplete tasks
        client.post(
            "/api/tasks",
            headers=auth_header(valid_token),
            json={"title": "Incomplete task"},
        )
        response = client.post(
            "/api/tasks",
            headers=auth_header(valid_token),
            json={"title": "Completed task"},
        )
        task_id = response.json()["id"]

        # Mark as complete
        client.patch(
            f"/api/tasks/{task_id}/complete",
            headers=auth_header(valid_token),
        )

        # Filter by completed=true
        response = client.get(
            "/api/tasks?completed=true", headers=auth_header(valid_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["tasks"][0]["title"] == "Completed task"

        # Filter by completed=false
        response = client.get(
            "/api/tasks?completed=false", headers=auth_header(valid_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["tasks"][0]["title"] == "Incomplete task"


class TestCreateTask:
    """Tests for POST /api/tasks endpoint."""

    def test_create_task_requires_auth(self, client: TestClient) -> None:
        """Unauthenticated request returns 401."""
        response = client.post("/api/tasks", json={"title": "Test"})
        assert response.status_code == 401

    def test_create_task_success(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Creates task with valid data."""
        response = client.post(
            "/api/tasks",
            headers=auth_header(valid_token),
            json={"title": "New task", "description": "Task description"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "New task"
        assert data["description"] == "Task description"
        assert data["completed"] is False
        assert "id" in data
        assert "created_at" in data
        assert "updated_at" in data

    def test_create_task_minimal(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Creates task with only required fields."""
        response = client.post(
            "/api/tasks",
            headers=auth_header(valid_token),
            json={"title": "Minimal task"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Minimal task"
        assert data["description"] == ""

    def test_create_task_empty_title_fails(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Empty title returns validation error."""
        response = client.post(
            "/api/tasks",
            headers=auth_header(valid_token),
            json={"title": ""},
        )
        assert response.status_code == 422

    def test_create_task_title_too_long_fails(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Title exceeding max length returns validation error."""
        response = client.post(
            "/api/tasks",
            headers=auth_header(valid_token),
            json={"title": "x" * 201},
        )
        assert response.status_code == 422


class TestGetTask:
    """Tests for GET /api/tasks/{task_id} endpoint."""

    def test_get_task_requires_auth(self, client: TestClient) -> None:
        """Unauthenticated request returns 401."""
        response = client.get("/api/tasks/1")
        assert response.status_code == 401

    def test_get_task_success(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Returns task by ID."""
        # Create a task
        create_response = client.post(
            "/api/tasks",
            headers=auth_header(valid_token),
            json={"title": "My task"},
        )
        task_id = create_response.json()["id"]

        # Get the task
        response = client.get(
            f"/api/tasks/{task_id}", headers=auth_header(valid_token)
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == task_id
        assert data["title"] == "My task"

    def test_get_task_not_found(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Returns 404 for non-existent task."""
        response = client.get(
            "/api/tasks/99999", headers=auth_header(valid_token)
        )
        assert response.status_code == 404
        assert response.json()["detail"]["code"] == "TASK_NOT_FOUND"

    def test_get_task_other_user_not_found(
        self, client: TestClient, valid_token: str, other_user_id: str, session
    ) -> None:
        """Cannot access other user's tasks."""
        # Create task as first user
        create_response = client.post(
            "/api/tasks",
            headers=auth_header(valid_token),
            json={"title": "User 1 task"},
        )
        task_id = create_response.json()["id"]

        # Try to access as second user
        other_token = create_jwt_token(other_user_id, db_session=session)
        response = client.get(
            f"/api/tasks/{task_id}", headers=auth_header(other_token)
        )
        assert response.status_code == 404


class TestUpdateTask:
    """Tests for PUT /api/tasks/{task_id} endpoint."""

    def test_update_task_requires_auth(self, client: TestClient) -> None:
        """Unauthenticated request returns 401."""
        response = client.put("/api/tasks/1", json={"title": "Updated"})
        assert response.status_code == 401

    def test_update_task_success(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Updates task with valid data."""
        # Create a task
        create_response = client.post(
            "/api/tasks",
            headers=auth_header(valid_token),
            json={"title": "Original"},
        )
        task_id = create_response.json()["id"]

        # Update the task
        response = client.put(
            f"/api/tasks/{task_id}",
            headers=auth_header(valid_token),
            json={"title": "Updated", "description": "New desc", "completed": True},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated"
        assert data["description"] == "New desc"
        assert data["completed"] is True

    def test_update_task_partial(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Partial update only changes specified fields."""
        # Create a task
        create_response = client.post(
            "/api/tasks",
            headers=auth_header(valid_token),
            json={"title": "Original", "description": "Original desc"},
        )
        task_id = create_response.json()["id"]

        # Update only title
        response = client.put(
            f"/api/tasks/{task_id}",
            headers=auth_header(valid_token),
            json={"title": "Updated title"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated title"
        assert data["description"] == "Original desc"  # Unchanged

    def test_update_task_not_found(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Returns 404 for non-existent task."""
        response = client.put(
            "/api/tasks/99999",
            headers=auth_header(valid_token),
            json={"title": "Updated"},
        )
        assert response.status_code == 404

    def test_update_task_other_user_not_found(
        self, client: TestClient, valid_token: str, other_user_id: str, session
    ) -> None:
        """Cannot update other user's tasks."""
        # Create task as first user
        create_response = client.post(
            "/api/tasks",
            headers=auth_header(valid_token),
            json={"title": "User 1 task"},
        )
        task_id = create_response.json()["id"]

        # Try to update as second user
        other_token = create_jwt_token(other_user_id, db_session=session)
        response = client.put(
            f"/api/tasks/{task_id}",
            headers=auth_header(other_token),
            json={"title": "Hijacked"},
        )
        assert response.status_code == 404


class TestDeleteTask:
    """Tests for DELETE /api/tasks/{task_id} endpoint."""

    def test_delete_task_requires_auth(self, client: TestClient) -> None:
        """Unauthenticated request returns 401."""
        response = client.delete("/api/tasks/1")
        assert response.status_code == 401

    def test_delete_task_success(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Soft deletes task (returns 204)."""
        # Create a task
        create_response = client.post(
            "/api/tasks",
            headers=auth_header(valid_token),
            json={"title": "To delete"},
        )
        task_id = create_response.json()["id"]

        # Delete the task
        response = client.delete(
            f"/api/tasks/{task_id}", headers=auth_header(valid_token)
        )
        assert response.status_code == 204

        # Verify task is no longer returned
        response = client.get(
            f"/api/tasks/{task_id}", headers=auth_header(valid_token)
        )
        assert response.status_code == 404

    def test_delete_task_not_in_list(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Deleted task not returned in list."""
        # Create and delete a task
        create_response = client.post(
            "/api/tasks",
            headers=auth_header(valid_token),
            json={"title": "To delete"},
        )
        task_id = create_response.json()["id"]
        client.delete(f"/api/tasks/{task_id}", headers=auth_header(valid_token))

        # Verify not in list
        response = client.get("/api/tasks", headers=auth_header(valid_token))
        assert response.status_code == 200
        assert response.json()["total"] == 0

    def test_delete_task_not_found(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Returns 404 for non-existent task."""
        response = client.delete(
            "/api/tasks/99999", headers=auth_header(valid_token)
        )
        assert response.status_code == 404

    def test_delete_task_other_user_not_found(
        self, client: TestClient, valid_token: str, other_user_id: str, session
    ) -> None:
        """Cannot delete other user's tasks."""
        # Create task as first user
        create_response = client.post(
            "/api/tasks",
            headers=auth_header(valid_token),
            json={"title": "User 1 task"},
        )
        task_id = create_response.json()["id"]

        # Try to delete as second user
        other_token = create_jwt_token(other_user_id, db_session=session)
        response = client.delete(
            f"/api/tasks/{task_id}", headers=auth_header(other_token)
        )
        assert response.status_code == 404


class TestToggleCompletion:
    """Tests for PATCH /api/tasks/{task_id}/complete endpoint."""

    def test_toggle_requires_auth(self, client: TestClient) -> None:
        """Unauthenticated request returns 401."""
        response = client.patch("/api/tasks/1/complete")
        assert response.status_code == 401

    def test_toggle_completion(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Toggles completion status."""
        # Create a task (initially incomplete)
        create_response = client.post(
            "/api/tasks",
            headers=auth_header(valid_token),
            json={"title": "Toggle me"},
        )
        task_id = create_response.json()["id"]
        assert create_response.json()["completed"] is False

        # Toggle to complete
        response = client.patch(
            f"/api/tasks/{task_id}/complete", headers=auth_header(valid_token)
        )
        assert response.status_code == 200
        assert response.json()["completed"] is True

        # Toggle back to incomplete
        response = client.patch(
            f"/api/tasks/{task_id}/complete", headers=auth_header(valid_token)
        )
        assert response.status_code == 200
        assert response.json()["completed"] is False

    def test_toggle_not_found(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Returns 404 for non-existent task."""
        response = client.patch(
            "/api/tasks/99999/complete", headers=auth_header(valid_token)
        )
        assert response.status_code == 404


class TestDataIsolation:
    """Tests for multi-user data isolation."""

    def test_users_only_see_own_tasks(
        self, client: TestClient, test_user_id: str, other_user_id: str, session
    ) -> None:
        """Each user only sees their own tasks."""
        token1 = create_jwt_token(test_user_id, db_session=session)
        token2 = create_jwt_token(other_user_id, db_session=session)

        # User 1 creates a task
        client.post(
            "/api/tasks",
            headers=auth_header(token1),
            json={"title": "User 1 task"},
        )

        # User 2 creates a task
        client.post(
            "/api/tasks",
            headers=auth_header(token2),
            json={"title": "User 2 task"},
        )

        # User 1 only sees their task
        response = client.get("/api/tasks", headers=auth_header(token1))
        assert response.json()["total"] == 1
        assert response.json()["tasks"][0]["title"] == "User 1 task"

        # User 2 only sees their task
        response = client.get("/api/tasks", headers=auth_header(token2))
        assert response.json()["total"] == 1
        assert response.json()["tasks"][0]["title"] == "User 2 task"
