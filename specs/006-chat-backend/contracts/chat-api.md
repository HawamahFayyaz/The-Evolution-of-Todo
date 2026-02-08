# API Contract: Chat Backend

**Branch**: `006-chat-backend` | **Date**: 2026-02-08
**Source**: `specs/features/004-chat-api.md`

---

## POST /api/chat

**Auth**: Required (Bearer token)

### Request
```json
{
  "conversation_id": 1,
  "message": "Add buy groceries to my list"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `conversation_id` | int \| null | No | Null → creates new conversation. Pydantic coerces string "1" to int. |
| `message` | string | Yes | 1-2000 chars, trimmed, no whitespace-only |

### Response (200 OK)
```json
{
  "conversation_id": 1,
  "response": "I've added 'Buy groceries' to your task list.",
  "tool_calls": [
    {
      "tool": "add_task",
      "args": { "title": "Buy groceries" },
      "result": { "success": true, "task_id": 42, "title": "Buy groceries", "status": "pending" }
    }
  ]
}
```

### Errors

| Status | Code | When |
|--------|------|------|
| 401 | `INVALID_SESSION` | Missing/invalid/expired token |
| 404 | `CONVERSATION_NOT_FOUND` | Bad conversation_id or not owned |
| 422 | `VALIDATION_ERROR` | Empty message, too long, etc. |
| 429 | `RATE_LIMIT_EXCEEDED` | >10 req/min/user |
| 500 | `INTERNAL_SERVER_ERROR` | Unexpected failure |
| 503 | `AI_SERVICE_UNAVAILABLE` | OpenAI API down/timeout |

---

## GET /api/conversations/{conversation_id}/messages

**Auth**: Required (Bearer token)

### Request
Query params: `limit` (int, 1-100, default 50)

### Response (200 OK)
```json
[
  {
    "id": 1,
    "role": "user",
    "content": "Add buy groceries to my tasks",
    "tool_calls": null,
    "created_at": "2026-02-08T10:30:00Z"
  },
  {
    "id": 2,
    "role": "assistant",
    "content": "I've added 'Buy groceries' to your task list.",
    "tool_calls": [
      { "tool": "add_task", "args": { "title": "Buy groceries" }, "result": { "success": true, "task_id": 42 } }
    ],
    "created_at": "2026-02-08T10:30:02Z"
  }
]
```

### Errors

| Status | Code | When |
|--------|------|------|
| 401 | `INVALID_SESSION` | Missing/invalid/expired token |
| 404 | `CONVERSATION_NOT_FOUND` | Conversation doesn't exist or belongs to another user (prevents enumeration) |

---

## Frontend Alignment

| Frontend Expectation | Backend Provides | Status |
|---------------------|-----------------|--------|
| `POST /api/chat` | `routes/chat.py` | To build |
| `GET /api/conversations/{id}/messages` | `routes/chat.py` | To build |
| `conversation_id` as string from localStorage | Pydantic coerces to int | Handled |
| `tool_calls` with `args` field name | `ToolCallResponse.args` | Aligned |
| snake_case response fields | All snake_case | Aligned |
| `tool_calls: null` when no tools | `ChatResponse.tool_calls = None` | Aligned |
