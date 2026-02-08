"""Integration tests for chat API endpoints."""

from unittest.mock import AsyncMock, patch, MagicMock
from dataclasses import dataclass

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from models import Conversation, Message
from tests.conftest import auth_header, create_jwt_token


# --- Mock helpers ---

@dataclass
class MockRunResult:
    """Mock of agents RunResult for testing."""
    final_output: str
    new_items: list


def _create_mock_runner(response_text: str = "Done!", tool_calls: list | None = None):
    """Create a mock for Runner.run that returns a fake RunResult.

    Args:
        response_text: The AI response text.
        tool_calls: Optional tool call items to include.

    Returns:
        AsyncMock configured to return a MockRunResult.
    """
    mock_result = MockRunResult(
        final_output=response_text,
        new_items=tool_calls or [],
    )
    mock_run = AsyncMock(return_value=mock_result)
    return mock_run


class TestPostChat:
    """Tests for POST /api/chat endpoint."""

    def test_chat_requires_auth(self, client: TestClient) -> None:
        """Unauthenticated request returns 401."""
        response = client.post("/api/chat", json={"message": "hello"})
        assert response.status_code == 401

    def test_chat_empty_message_rejected(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Empty message returns 422."""
        response = client.post(
            "/api/chat",
            headers=auth_header(valid_token),
            json={"message": ""},
        )
        assert response.status_code == 422

    def test_chat_message_too_long_rejected(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Message over 2000 chars returns 422."""
        response = client.post(
            "/api/chat",
            headers=auth_header(valid_token),
            json={"message": "x" * 2001},
        )
        assert response.status_code == 422

    @patch("agent.chat_agent.Runner.run")
    def test_chat_creates_new_conversation(
        self, mock_run: AsyncMock, client: TestClient, valid_token: str
    ) -> None:
        """POST without conversation_id creates a new conversation."""
        mock_run.return_value = MockRunResult(
            final_output="Hello! How can I help?",
            new_items=[],
        )

        response = client.post(
            "/api/chat",
            headers=auth_header(valid_token),
            json={"message": "hi"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["conversation_id"] is not None
        assert data["response"] == "Hello! How can I help?"
        assert data["tool_calls"] is None

    @patch("agent.chat_agent.Runner.run")
    def test_chat_uses_existing_conversation(
        self,
        mock_run: AsyncMock,
        client: TestClient,
        valid_token: str,
        session: Session,
        test_user_id: str,
    ) -> None:
        """POST with conversation_id reuses existing conversation."""
        # Create a conversation
        conv = Conversation(user_id=test_user_id)
        session.add(conv)
        session.commit()
        session.refresh(conv)

        mock_run.return_value = MockRunResult(
            final_output="Got it!",
            new_items=[],
        )

        response = client.post(
            "/api/chat",
            headers=auth_header(valid_token),
            json={"message": "list my tasks", "conversation_id": conv.id},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["conversation_id"] == conv.id

    @patch("agent.chat_agent.Runner.run")
    def test_chat_nonexistent_conversation_returns_404(
        self, mock_run: AsyncMock, client: TestClient, valid_token: str
    ) -> None:
        """POST with invalid conversation_id returns 404."""
        response = client.post(
            "/api/chat",
            headers=auth_header(valid_token),
            json={"message": "hello", "conversation_id": 99999},
        )

        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "CONVERSATION_NOT_FOUND"

    @patch("agent.chat_agent.Runner.run")
    def test_chat_other_users_conversation_returns_404(
        self,
        mock_run: AsyncMock,
        client: TestClient,
        valid_token: str,
        session: Session,
    ) -> None:
        """POST with another user's conversation returns 404 (enumeration prevention)."""
        conv = Conversation(user_id="other-user-xyz")
        session.add(conv)
        session.commit()
        session.refresh(conv)

        response = client.post(
            "/api/chat",
            headers=auth_header(valid_token),
            json={"message": "hello", "conversation_id": conv.id},
        )

        assert response.status_code == 404

    @patch("agent.chat_agent.Runner.run")
    def test_chat_ai_timeout_returns_503(
        self, mock_run: AsyncMock, client: TestClient, valid_token: str
    ) -> None:
        """AI service timeout returns 503."""
        import asyncio
        mock_run.side_effect = asyncio.TimeoutError()

        response = client.post(
            "/api/chat",
            headers=auth_header(valid_token),
            json={"message": "hello"},
        )

        assert response.status_code == 503
        data = response.json()
        assert data["error"]["code"] == "AI_SERVICE_UNAVAILABLE"

    @patch("agent.chat_agent.Runner.run")
    def test_chat_persists_messages(
        self,
        mock_run: AsyncMock,
        client: TestClient,
        valid_token: str,
        session: Session,
    ) -> None:
        """Both user and assistant messages are saved to the database."""
        mock_run.return_value = MockRunResult(
            final_output="I see your tasks!",
            new_items=[],
        )

        response = client.post(
            "/api/chat",
            headers=auth_header(valid_token),
            json={"message": "show my tasks"},
        )

        assert response.status_code == 200
        conv_id = response.json()["conversation_id"]

        # Check messages were persisted
        from sqlmodel import select
        messages = session.exec(
            select(Message).where(Message.conversation_id == conv_id)
            .order_by(Message.created_at.asc())
        ).all()

        assert len(messages) == 2
        assert messages[0].role == "user"
        assert messages[0].content == "show my tasks"
        assert messages[1].role == "assistant"
        assert messages[1].content == "I see your tasks!"


class TestGetMessages:
    """Tests for GET /api/conversations/{id}/messages endpoint."""

    def test_get_messages_requires_auth(self, client: TestClient) -> None:
        """Unauthenticated request returns 401."""
        response = client.get("/api/conversations/1/messages")
        assert response.status_code == 401

    def test_get_messages_nonexistent_conversation(
        self, client: TestClient, valid_token: str
    ) -> None:
        """Non-existent conversation returns 404."""
        response = client.get(
            "/api/conversations/99999/messages",
            headers=auth_header(valid_token),
        )
        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "CONVERSATION_NOT_FOUND"

    def test_get_messages_other_users_conversation(
        self,
        client: TestClient,
        valid_token: str,
        session: Session,
    ) -> None:
        """Other user's conversation returns 404 (enumeration prevention)."""
        conv = Conversation(user_id="other-user-xyz")
        session.add(conv)
        session.commit()
        session.refresh(conv)

        response = client.get(
            f"/api/conversations/{conv.id}/messages",
            headers=auth_header(valid_token),
        )
        assert response.status_code == 404

    def test_get_messages_returns_history(
        self,
        client: TestClient,
        valid_token: str,
        session: Session,
        test_user_id: str,
    ) -> None:
        """Returns messages in creation order."""
        conv = Conversation(user_id=test_user_id)
        session.add(conv)
        session.commit()
        session.refresh(conv)

        msg1 = Message(
            conversation_id=conv.id,
            user_id=test_user_id,
            role="user",
            content="Hello",
        )
        msg2 = Message(
            conversation_id=conv.id,
            user_id=test_user_id,
            role="assistant",
            content="Hi there!",
        )
        session.add_all([msg1, msg2])
        session.commit()

        response = client.get(
            f"/api/conversations/{conv.id}/messages",
            headers=auth_header(valid_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert data[0]["role"] == "user"
        assert data[0]["content"] == "Hello"
        assert data[1]["role"] == "assistant"
        assert data[1]["content"] == "Hi there!"

    def test_get_messages_with_limit(
        self,
        client: TestClient,
        valid_token: str,
        session: Session,
        test_user_id: str,
    ) -> None:
        """Limit parameter restricts message count."""
        conv = Conversation(user_id=test_user_id)
        session.add(conv)
        session.commit()
        session.refresh(conv)

        for i in range(5):
            msg = Message(
                conversation_id=conv.id,
                user_id=test_user_id,
                role="user",
                content=f"Message {i}",
            )
            session.add(msg)
        session.commit()

        response = client.get(
            f"/api/conversations/{conv.id}/messages?limit=3",
            headers=auth_header(valid_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

    def test_get_messages_with_tool_calls(
        self,
        client: TestClient,
        valid_token: str,
        session: Session,
        test_user_id: str,
    ) -> None:
        """Messages with tool_calls_json are parsed correctly."""
        import json

        conv = Conversation(user_id=test_user_id)
        session.add(conv)
        session.commit()
        session.refresh(conv)

        tool_calls = [
            {"tool": "add_task", "args": {"title": "Test"}, "result": {"success": True}},
        ]
        msg = Message(
            conversation_id=conv.id,
            user_id=test_user_id,
            role="assistant",
            content="Created!",
            tool_calls_json=json.dumps(tool_calls),
        )
        session.add(msg)
        session.commit()

        response = client.get(
            f"/api/conversations/{conv.id}/messages",
            headers=auth_header(valid_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["tool_calls"] is not None
        assert data[0]["tool_calls"][0]["tool"] == "add_task"
