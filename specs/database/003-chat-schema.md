# Database Schema: Chat Models (Conversation & Message)

**Version**: 1.0.0 (Phase III - AI Chatbot)
**Created**: 2026-02-08
**Status**: Draft
**Feature Branch**: `003-chat-schema`
**Generated Using**: `.claude/skills/database-schema/`
**Architecture Reference**: `.claude/blueprints/ai-chatbot/`

---

## Overview

Two new SQLModel tables for Phase III AI chatbot: `conversations` and `messages`. These tables persist chat history to Neon PostgreSQL, enabling stateless backend operation. The backend loads conversation history from these tables on each request, processes the message, saves the result, then forgets everything.

### Relationship to Existing Schema

```
Existing (Phase II):              New (Phase III):
+------------------+              +------------------+
|     session      |              |  conversations   |
|  (Better Auth)   |              |------------------|
|------------------|              | id (PK)          |
| userId -------+  |              | user_id (FK*)    |
+------------------+  |              | created_at       |
                   |              | updated_at       |
                   |              | deleted_at       |
                   v              +--------+---------+
            +------+-------+              |
            |    tasks     |              |
            |--------------|     +--------v---------+
            | id (PK)      |     |    messages      |
            | user_id      |     |------------------|
            | title        |     | id (PK)          |
            | description  |     | conversation_id  |
            | completed    |     | user_id          |
            | priority     |     | role             |
            | due_date     |     | content          |
            | created_at   |     | tool_calls_json  |
            | updated_at   |     | created_at       |
            | deleted_at   |     +------------------+
            +--------------+

* user_id is varchar(255) matching Better Auth's userId format,
  NOT a foreign key to a users table (Better Auth manages users).
```

---

## Table: conversations

Represents a chat session between a user and the AI assistant.

### SQL Definition

```sql
CREATE TABLE conversations (
    id          SERIAL PRIMARY KEY,
    user_id     VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Indexes
CREATE INDEX ix_conversations_user_id ON conversations(user_id);
CREATE INDEX ix_conversations_deleted_at ON conversations(deleted_at);
CREATE INDEX ix_conversations_user_active ON conversations(user_id, deleted_at, updated_at DESC);
```

### SQLModel Definition

```python
from datetime import UTC, datetime
from functools import partial
from typing import ClassVar

from sqlalchemy import Index
from sqlmodel import Field, SQLModel


class Conversation(SQLModel, table=True):
    """Chat conversation session.

    Represents a conversation between a user and the AI assistant.
    A user can have multiple conversations. Conversations are soft-deleted.

    Security:
        user_id is set from the session token, never from request body.
        All queries MUST filter by user_id AND deleted_at IS NULL.
    """

    __tablename__ = "conversations"

    __table_args__: ClassVar[tuple] = (
        Index(
            "ix_conversations_user_active",
            "user_id", "deleted_at", "updated_at",
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, min_length=1, max_length=255)
    created_at: datetime = Field(
        default_factory=partial(datetime.now, UTC),
    )
    updated_at: datetime = Field(
        default_factory=partial(datetime.now, UTC),
    )
    deleted_at: datetime | None = Field(default=None, index=True)
```

### Field Details

| Field | Type | Required | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `id` | integer | Auto | Auto-increment | Primary key, unique | Conversation identifier |
| `user_id` | varchar(255) | Yes | - | Not null, indexed, 1-255 chars | Owner's user ID from session token |
| `created_at` | timestamptz | Yes | `NOW()` | UTC | When conversation started |
| `updated_at` | timestamptz | Yes | `NOW()` | UTC | When last message was sent |
| `deleted_at` | timestamptz | No | NULL | Indexed | Soft delete timestamp |

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `ix_conversations_user_id` | `user_id` | Filter conversations by owner |
| `ix_conversations_deleted_at` | `deleted_at` | Filter active (non-deleted) conversations |
| `ix_conversations_user_active` | `user_id, deleted_at, updated_at` | Common query: "get user's active conversations sorted by recent" |

---

## Table: messages

Represents an individual message in a conversation (user or assistant).

### SQL Definition

```sql
CREATE TABLE messages (
    id               SERIAL PRIMARY KEY,
    conversation_id  INTEGER NOT NULL REFERENCES conversations(id),
    user_id          VARCHAR(255) NOT NULL,
    role             VARCHAR(50) NOT NULL,
    content          TEXT NOT NULL,
    tool_calls_json  TEXT DEFAULT NULL,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX ix_messages_conversation_id ON messages(conversation_id);
CREATE INDEX ix_messages_user_id ON messages(user_id);
CREATE INDEX ix_messages_conversation_created ON messages(conversation_id, created_at);
```

### SQLModel Definition

```python
class Message(SQLModel, table=True):
    """Chat message within a conversation.

    Stores both user messages and assistant responses. Tool call data
    is stored as JSON text in tool_calls_json for flexibility.

    Roles:
        - "user": Message from the human user
        - "assistant": Response from the AI assistant

    Security:
        user_id is denormalized from conversation for query efficiency.
        All queries MUST filter by user_id for data isolation.
    """

    __tablename__ = "messages"

    __table_args__: ClassVar[tuple] = (
        Index(
            "ix_messages_conversation_created",
            "conversation_id", "created_at",
        ),
    )

    id: int | None = Field(default=None, primary_key=True)
    conversation_id: int = Field(index=True, foreign_key="conversations.id")
    user_id: str = Field(index=True, min_length=1, max_length=255)
    role: str = Field(max_length=50)  # "user" | "assistant"
    content: str  # No max_length on TEXT columns
    tool_calls_json: str | None = Field(default=None)  # JSON string
    created_at: datetime = Field(
        default_factory=partial(datetime.now, UTC),
    )
```

### Field Details

| Field | Type | Required | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| `id` | integer | Auto | Auto-increment | Primary key | Message identifier |
| `conversation_id` | integer | Yes | - | FK -> conversations.id, indexed | Parent conversation |
| `user_id` | varchar(255) | Yes | - | Not null, indexed | Message owner (denormalized for query efficiency) |
| `role` | varchar(50) | Yes | - | Not null, "user" or "assistant" | Who sent the message |
| `content` | text | Yes | - | Not null | Message text content |
| `tool_calls_json` | text | No | NULL | Valid JSON when present | Serialized tool call data |
| `created_at` | timestamptz | Yes | `NOW()` | UTC | When message was created |

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `ix_messages_conversation_id` | `conversation_id` | FK lookup, filter by conversation |
| `ix_messages_user_id` | `user_id` | Data isolation queries |
| `ix_messages_conversation_created` | `conversation_id, created_at` | Load conversation history in order (most common query) |

### tool_calls_json Format

When the assistant makes tool calls, they are stored as a JSON string:

```json
[
  {
    "tool": "add_task",
    "args": {
      "title": "Buy groceries"
    },
    "result": {
      "success": true,
      "task_id": 42,
      "title": "Buy groceries",
      "status": "pending"
    }
  }
]
```

**Serialization Rules**:
- Use `json.dumps()` when saving, `json.loads()` when reading.
- When no tools were called: store `NULL` (not `"[]"` or `"null"`).
- When tools were called: store a JSON array string.
- Malformed JSON on read: log error, return `null` to frontend.

**API Response Mapping**:
- `tool_calls_json IS NULL` -> API returns `"tool_calls": null`
- `tool_calls_json IS NOT NULL` -> API returns parsed JSON array

**Why JSON text instead of JSONB?**: SQLModel/SQLAlchemy compatibility and simplicity. For this scale, TEXT with JSON is sufficient. Can migrate to JSONB if query-inside-JSON is needed later.

---

## Pydantic Request/Response Models

```python
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request body for POST /api/chat.

    Note: conversation_id accepts both int and string.
    Pydantic coerces string "1" to int 1 automatically,
    so frontend can send either type from localStorage.
    """

    conversation_id: int | None = None
    message: str = Field(min_length=1, max_length=2000)


class ToolCallResponse(BaseModel):
    """Single tool call in a chat response.

    Field name is 'args' (not 'arguments') to match
    frontend ToolCall interface in types/chat.ts.
    """

    tool: str
    args: dict
    result: dict


class ChatResponse(BaseModel):
    """Response body for POST /api/chat."""

    conversation_id: int
    response: str
    tool_calls: list[ToolCallResponse] | None = None


class MessageResponse(BaseModel):
    """Single message in conversation history."""

    id: int
    role: str
    content: str
    tool_calls: list[ToolCallResponse] | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
```

---

## Query Patterns

### Create New Conversation

```python
def create_conversation(user_id: str, session: Session) -> Conversation:
    conversation = Conversation(user_id=user_id)
    session.add(conversation)
    session.commit()
    session.refresh(conversation)
    return conversation
```

### Get Conversation (with ownership check)

```python
def get_conversation(
    conversation_id: int,
    user_id: str,
    session: Session,
) -> Conversation | None:
    conversation = session.exec(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
            Conversation.deleted_at.is_(None),
        )
    ).first()
    return conversation
```

### Save Message

```python
import json

def save_message(
    conversation_id: int,
    user_id: str,
    role: str,
    content: str,
    session: Session,
    tool_calls: list[dict] | None = None,
) -> Message:
    message = Message(
        conversation_id=conversation_id,
        user_id=user_id,
        role=role,
        content=content,
        tool_calls_json=json.dumps(tool_calls) if tool_calls else None,
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    return message
```

### Load Conversation History (Most Common Query)

```python
def load_messages(
    conversation_id: int,
    session: Session,
    limit: int = 50,
) -> list[Message]:
    """Load recent messages for AI context window."""
    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .limit(limit)
    ).all()
    return messages
```

### Soft Delete Conversation

```python
def soft_delete_conversation(
    conversation_id: int,
    user_id: str,
    session: Session,
) -> bool:
    conversation = get_conversation(conversation_id, user_id, session)
    if not conversation:
        return False
    conversation.deleted_at = datetime.now(UTC)
    conversation.updated_at = datetime.now(UTC)
    session.commit()
    return True
```

---

## Table Creation

These tables are created automatically by SQLModel's `create_db_and_tables()` in `main.py` lifespan handler, which already runs at startup:

```python
# main.py (existing)
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    create_db_and_tables()  # This will create conversations + messages tables
    yield
```

The models just need to be imported in `models.py` (or a file imported by `main.py`) before `create_db_and_tables()` runs.

---

## Migration from Phase II

### What Changes

| Item | Phase II | Phase III |
|------|----------|-----------|
| Tables | `tasks`, `session`, `user`, `account`, `verification` | + `conversations`, `messages` |
| Models file | `Task` only | + `Conversation`, `Message` |
| Data migration | N/A | No migration needed -- new tables only |

### Backward Compatibility

- **Zero breaking changes**: Existing `tasks` table is untouched.
- **Same user_id format**: `conversations.user_id` uses the same varchar(255) format as `tasks.user_id`.
- **Same database**: Tables are created in the same Neon PostgreSQL instance.
- **Same session management**: Uses existing `get_session()` from `database.py`.

---

## Validation Rules

| Field | Rule | Error |
|-------|------|-------|
| `conversation.user_id` | Not empty, max 255 chars | "User ID is required" |
| `message.role` | Must be "user" or "assistant" | "Invalid role" |
| `message.content` | Not empty | "Content is required" |
| `message.conversation_id` | Must reference valid conversation | FK constraint |
| `tool_calls_json` | Valid JSON when not null | Serialization error |

---

## Performance Considerations

1. **Composite index on messages**: `(conversation_id, created_at)` optimizes the most common query (loading conversation history in order).
2. **Limit clause**: Always use `LIMIT 50` when loading history to control memory and LLM token usage.
3. **Neon cold starts**: First query after inactivity may take 1-3 seconds. The existing retry logic in the dashboard layout handles this.
4. **No cascading deletes**: Soft-deleting a conversation does NOT delete messages. Messages remain for audit/compliance.

---

## Related Specifications

- [Chat API: 004-chat-api](../features/004-chat-api.md) - Endpoints using these models
- [MCP Tools: 005-mcp-server](../features/005-mcp-server.md) - Tools that operate on tasks table
- [Existing Schema: schema.md](./schema.md) - Phase I/II task schema
- [Database Schema Skill](../../.claude/skills/database-schema/Skill.md) - Code generation patterns
