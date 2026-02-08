# Data Model: 006-chat-backend

**Branch**: `006-chat-backend` | **Date**: 2026-02-08
**Phase**: 1 (Design) | **Status**: Complete
**Source**: `specs/database/003-chat-schema.md`

---

## New Tables

### conversations

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | SERIAL | No | auto-increment | PRIMARY KEY |
| `user_id` | VARCHAR(255) | No | - | NOT NULL, INDEX |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | NOT NULL |
| `updated_at` | TIMESTAMPTZ | No | `NOW()` | NOT NULL |
| `deleted_at` | TIMESTAMPTZ | Yes | NULL | INDEX |

**Indexes**:
- `ix_conversations_user_id` on `(user_id)`
- `ix_conversations_deleted_at` on `(deleted_at)`
- `ix_conversations_user_active` on `(user_id, deleted_at, updated_at)`

### messages

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | SERIAL | No | auto-increment | PRIMARY KEY |
| `conversation_id` | INTEGER | No | - | FK → conversations.id, INDEX |
| `user_id` | VARCHAR(255) | No | - | NOT NULL, INDEX |
| `role` | VARCHAR(50) | No | - | NOT NULL ("user" or "assistant") |
| `content` | TEXT | No | - | NOT NULL |
| `tool_calls_json` | TEXT | Yes | NULL | JSON string when present |
| `created_at` | TIMESTAMPTZ | No | `NOW()` | NOT NULL |

**Indexes**:
- `ix_messages_conversation_id` on `(conversation_id)`
- `ix_messages_user_id` on `(user_id)`
- `ix_messages_conversation_created` on `(conversation_id, created_at)`

---

## SQLModel Classes

### Conversation

```python
class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"
    __table_args__: ClassVar[tuple] = (
        Index("ix_conversations_user_active", "user_id", "deleted_at", "updated_at"),
    )

    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, min_length=1, max_length=255)
    created_at: datetime = Field(default_factory=partial(datetime.now, UTC))
    updated_at: datetime = Field(default_factory=partial(datetime.now, UTC))
    deleted_at: datetime | None = Field(default=None, index=True)
```

### Message

```python
class Message(SQLModel, table=True):
    __tablename__ = "messages"
    __table_args__: ClassVar[tuple] = (
        Index("ix_messages_conversation_created", "conversation_id", "created_at"),
    )

    id: int | None = Field(default=None, primary_key=True)
    conversation_id: int = Field(index=True, foreign_key="conversations.id")
    user_id: str = Field(index=True, min_length=1, max_length=255)
    role: str = Field(max_length=50)
    content: str
    tool_calls_json: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=partial(datetime.now, UTC))
```

---

## Pydantic Request/Response Models

### ChatRequest
```python
class ChatRequest(BaseModel):
    conversation_id: int | None = None
    message: str = Field(min_length=1, max_length=2000)
```

### ChatResponse
```python
class ChatResponse(BaseModel):
    conversation_id: int
    response: str
    tool_calls: list[ToolCallResponse] | None = None
```

### ToolCallResponse
```python
class ToolCallResponse(BaseModel):
    tool: str
    args: dict
    result: dict
```

### MessageResponse
```python
class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    tool_calls: list[ToolCallResponse] | None = None
    created_at: datetime
    model_config = {"from_attributes": True}
```

---

## Relationship to Existing Models

- **No changes** to existing `Task`, `TaskCreate`, `TaskUpdate`, `TaskResponse` models
- `Conversation.user_id` uses same VARCHAR(255) format as `Task.user_id`
- Both tables live in the same Neon PostgreSQL instance
- `create_db_and_tables()` in `main.py` auto-creates new tables on startup

## Constitution Compliance

- `id`: SERIAL (matches existing Task pattern; constitution recommends UUID but we maintain consistency)
- `created_at`, `updated_at`: TIMESTAMPTZ with UTC default
- `deleted_at`: Nullable for soft deletes
- `user_id`: Indexed, derived from session token
