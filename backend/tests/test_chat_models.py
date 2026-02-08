"""Tests for Conversation and Message database models."""

import json
from datetime import UTC, datetime

import pytest
from sqlmodel import Session

from models import Conversation, Message


class TestConversation:
    """Tests for Conversation model."""

    def test_create_conversation(self, session: Session) -> None:
        """Conversation is created with user_id and timestamps."""
        conv = Conversation(user_id="user-1")
        session.add(conv)
        session.commit()
        session.refresh(conv)

        assert conv.id is not None
        assert conv.user_id == "user-1"
        assert conv.created_at is not None
        assert conv.updated_at is not None
        assert conv.deleted_at is None

    def test_soft_delete_conversation(self, session: Session) -> None:
        """Soft delete sets deleted_at timestamp."""
        conv = Conversation(user_id="user-1")
        session.add(conv)
        session.commit()

        conv.deleted_at = datetime.now(UTC)
        session.add(conv)
        session.commit()
        session.refresh(conv)

        assert conv.deleted_at is not None


class TestMessage:
    """Tests for Message model."""

    def test_create_message(self, session: Session) -> None:
        """Message is created with all required fields."""
        conv = Conversation(user_id="user-1")
        session.add(conv)
        session.commit()
        session.refresh(conv)

        msg = Message(
            conversation_id=conv.id,
            user_id="user-1",
            role="user",
            content="Hello, world!",
        )
        session.add(msg)
        session.commit()
        session.refresh(msg)

        assert msg.id is not None
        assert msg.conversation_id == conv.id
        assert msg.user_id == "user-1"
        assert msg.role == "user"
        assert msg.content == "Hello, world!"
        assert msg.tool_calls_json is None
        assert msg.created_at is not None

    def test_tool_calls_json_none_when_no_tools(self, session: Session) -> None:
        """tool_calls_json is None when no tool calls."""
        conv = Conversation(user_id="user-1")
        session.add(conv)
        session.commit()
        session.refresh(conv)

        msg = Message(
            conversation_id=conv.id,
            user_id="user-1",
            role="assistant",
            content="Just a text response.",
        )
        session.add(msg)
        session.commit()
        session.refresh(msg)

        assert msg.tool_calls_json is None

    def test_tool_calls_json_serialization(self, session: Session) -> None:
        """tool_calls_json round-trips through JSON correctly."""
        conv = Conversation(user_id="user-1")
        session.add(conv)
        session.commit()
        session.refresh(conv)

        tool_calls = [
            {"tool": "add_task", "args": {"title": "Test"}, "result": {"success": True}},
        ]
        msg = Message(
            conversation_id=conv.id,
            user_id="user-1",
            role="assistant",
            content="I created a task.",
            tool_calls_json=json.dumps(tool_calls),
        )
        session.add(msg)
        session.commit()
        session.refresh(msg)

        # Round-trip test
        parsed = json.loads(msg.tool_calls_json)
        assert parsed == tool_calls
        assert parsed[0]["tool"] == "add_task"
        assert parsed[0]["result"]["success"] is True

    def test_message_conversation_fk(self, session: Session) -> None:
        """Message references a valid conversation via FK."""
        conv = Conversation(user_id="user-1")
        session.add(conv)
        session.commit()
        session.refresh(conv)

        msg = Message(
            conversation_id=conv.id,
            user_id="user-1",
            role="user",
            content="Test",
        )
        session.add(msg)
        session.commit()
        session.refresh(msg)

        assert msg.conversation_id == conv.id
