# API Specification: Chat Endpoint

**Feature Branch**: `004-chat-api`
**Created**: 2026-02-08
**Status**: Draft
**Phase**: III (AI-Powered Todo Chatbot)
**Parent Feature**: 002-ai-chatbot
**Generated Using**: `.claude/skills/api-spec-generator/`
**Architecture Reference**: `.claude/blueprints/ai-chatbot/`

---

## Overview

Stateless chat API enabling natural language task management via AI assistant. The backend loads conversation history from the database on each request, processes the message through an AI agent with MCP tools, persists the result, and returns the response. No in-memory conversation state is held between requests.

### Architecture Pattern (from Blueprint)

```
Frontend (ChatContainer / FloatingChat)
    |
    POST /api/chat  (Bearer token)
    |
    v
Backend (FastAPI - STATELESS)
    |
    1. Verify session token -> get user_id
    2. Load conversation history from DB (or create new)
    3. Append user message to DB
    4. Build messages array from DB history
    5. Call AI agent with tools + history
    6. Persist assistant response + tool_calls to DB
    7. Return response to frontend
    |
    v
AI Agent (OpenAI / LLM)
    |
    Uses MCP Tools -> Database (tasks table)
```

---

## Endpoint 1: Send Message

### POST /api/chat

**Purpose**: Send a user message to the AI assistant and receive a response with optional tool calls.

**Authentication**: Required (Better Auth session token via Bearer header)

**Authorization**: User can only access their own conversations. user_id is derived from the verified session token, NEVER from the request body or path.

**Request Headers**:
| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | Yes | `Bearer <session_token>` |
| `Content-Type` | Yes | `application/json` |

**Path Parameters**: None

**Query Parameters**: None

**Request Body**:
```json
{
  "conversation_id": 1,
  "message": "Add buy groceries to my list"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `conversation_id` | integer \| null | No | If null/omitted, creates new conversation. Must be a valid conversation owned by the user if provided. Pydantic coerces string "1" to integer 1 automatically, so frontend can send either type. |
| `message` | string | Yes | 1-2000 characters, trimmed. Whitespace-only strings are rejected. |

**Response (Success)**:

**Status**: 200 OK
```json
{
  "conversation_id": 1,
  "response": "I've added 'Buy groceries' to your task list.",
  "tool_calls": [
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
}
```

| Field | Type | Always Present | Description |
|-------|------|----------------|-------------|
| `conversation_id` | integer | Yes | New or existing conversation ID |
| `response` | string | Yes | AI assistant's text response |
| `tool_calls` | array \| null | No | Only present when AI invoked MCP tools |

**ToolCall Object**:
| Field | Type | Description |
|-------|------|-------------|
| `tool` | string | Tool identifier: `add_task`, `list_tasks`, `complete_task`, `delete_task`, `update_task` |
| `args` | object | Arguments the AI passed to the tool (matches frontend `ToolCall.args`) |
| `result` | object | Structured result from the tool execution |

**Response (Errors)**:

**401 Unauthorized** - Missing or invalid session token
```json
{
  "error": {
    "code": "INVALID_SESSION",
    "message": "Invalid session. Please sign in again."
  }
}
```

**404 Not Found** - Conversation doesn't exist or doesn't belong to user
```json
{
  "error": {
    "code": "CONVERSATION_NOT_FOUND",
    "message": "Conversation not found"
  }
}
```

**422 Unprocessable Entity** - Validation failed
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "body.message",
        "message": "Message is required",
        "type": "value_error"
      }
    ]
  }
}
```

**429 Too Many Requests** - Rate limit exceeded
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please wait before sending another message."
  }
}
```

**500 Internal Server Error** - AI service or database failure
```json
{
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "An unexpected error occurred. Please try again later."
  }
}
```

**503 Service Unavailable** - AI service is down
```json
{
  "error": {
    "code": "AI_SERVICE_UNAVAILABLE",
    "message": "AI service is temporarily unavailable. You can still manage tasks from the Tasks view."
  }
}
```

**Idempotency**: No - Each POST creates a new message and generates a unique AI response.

**Rate Limiting**: 10 requests per minute per user (chat messages are expensive due to LLM calls).

**Performance Expectations**:
| Metric | Target |
|--------|--------|
| p50 response time | < 3s |
| p95 response time | < 5s |
| Timeout | 30s (LLM calls can be slow) |
| Max history loaded | 50 messages per request |

---

## Endpoint 2: Get Conversation History

### GET /api/conversations/{conversation_id}/messages

**Purpose**: Retrieve message history for a specific conversation, ordered chronologically.

**Authentication**: Required (Better Auth session token via Bearer header)

**Authorization**: User can only access conversations they own.

**Request Headers**:
| Header | Required | Value |
|--------|----------|-------|
| `Authorization` | Yes | `Bearer <session_token>` |

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversation_id` | integer | Yes | Conversation ID to fetch messages for |

**Query Parameters**:
| Parameter | Type | Default | Constraints | Description |
|-----------|------|---------|-------------|-------------|
| `limit` | integer | 50 | 1-100 | Maximum messages to return |

**Request Body**: None

**Response (Success)**:

**Status**: 200 OK
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
      {
        "tool": "add_task",
        "args": { "title": "Buy groceries" },
        "result": { "success": true, "task_id": 42 }
      }
    ],
    "created_at": "2026-02-08T10:30:02Z"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Message primary key |
| `role` | string | `"user"` or `"assistant"` |
| `content` | string | Message text |
| `tool_calls` | array \| null | Tool calls for this message (assistant only) |
| `created_at` | string | ISO 8601 UTC timestamp |

**Response (Errors)**:

**401 Unauthorized** - Missing/invalid session
```json
{
  "error": {
    "code": "INVALID_SESSION",
    "message": "Invalid session. Please sign in again."
  }
}
```

**404 Not Found** - Conversation doesn't exist or belongs to another user (prevents enumeration)
```json
{
  "error": {
    "code": "CONVERSATION_NOT_FOUND",
    "message": "Conversation not found"
  }
}
```

**Idempotency**: Yes - Multiple identical GET requests return the same data (unless new messages are added).

**Rate Limiting**: 30 requests per minute per user.

**Performance Expectations**:
| Metric | Target |
|--------|--------|
| p50 response time | < 200ms |
| p95 response time | < 500ms |
| Timeout | 5s |

---

## Business Rules

### ALWAYS:
- Derive `user_id` from verified session token (via `get_current_user` dependency)
- Verify conversation ownership before any access
- Persist user message to DB BEFORE calling AI agent
- Persist assistant response to DB AFTER receiving from AI
- Load only the last 50 messages as context for AI agent
- Use soft deletes for conversations (set `deleted_at`)
- Return structured error responses matching existing `main.py` format
- Log AI errors for debugging (separate from user-facing messages)

### NEVER:
- Trust `user_id` from request body or path parameters
- Store conversation state in memory between requests
- Return raw AI/LLM errors to the user
- Allow access to other users' conversations
- Hard delete conversations or messages
- Send more than 50 messages as context to the AI (cost control)

---

## Edge Cases

| Scenario | Status Code | Behavior |
|----------|-------------|----------|
| Empty message (whitespace only) | 422 | Reject with validation error |
| Message exceeds 2000 chars | 422 | Reject with validation error |
| Conversation ID doesn't exist | 404 | Return "Conversation not found" |
| Conversation belongs to other user | 404 | Return "Conversation not found" (prevent enumeration) |
| AI service timeout | 503 | Return friendly error, user message already saved |
| AI returns empty response | 200 | Return fallback message: "I'm not sure how to help with that." |
| Tool call fails (DB error) | 200 | AI receives error, explains to user in natural language |
| Very first message (no conversation) | 200 | Create conversation, then process message |
| Rate limit exceeded | 429 | Return rate limit error with retry suggestion |
| Invalid conversation_id type | 422 | Validation error |
| Concurrent messages same conversation | 200 | Both succeed (stateless - each loads latest history) |

---

## Stateless Request Flow (Pseudocode)

```python
@router.post("/api/chat")
async def chat(
    request: ChatRequest,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # 1. Get or create conversation
    if request.conversation_id:
        conversation = get_conversation(request.conversation_id, current_user, session)
        if not conversation:
            raise HTTPException(404, "Conversation not found")
    else:
        conversation = create_conversation(current_user, session)

    # 2. Save user message FIRST (never lose user input)
    save_message(conversation.id, current_user, "user", request.message, session)

    # 3. Load history from DB (stateless - no memory)
    history = load_messages(conversation.id, limit=50, session=session)

    # 4. Call AI agent with history + tools (stateless call)
    try:
        ai_response = await call_agent(history, current_user)
    except AIServiceError:
        raise HTTPException(503, "AI service unavailable")

    # 5. Save assistant response
    save_message(
        conversation.id, current_user, "assistant",
        ai_response.text, session,
        tool_calls=ai_response.tool_calls
    )

    # 6. Update conversation timestamp
    conversation.updated_at = datetime.now(UTC)
    session.commit()

    # 7. Return response (server forgets everything after this)
    return ChatResponse(
        conversation_id=conversation.id,
        response=ai_response.text,
        tool_calls=ai_response.tool_calls,
    )
```

---

## Frontend Compatibility Notes

The existing frontend (`frontend/lib/api/chat.ts`) calls:
- `POST /api/chat` with `{ conversation_id?: string, message: string }`
- `GET /api/conversations/{id}/messages?limit=50`

**Key alignment items**:
1. **conversation_id type**: Frontend sends as string (from localStorage), backend returns integer. Pydantic coerces string `"1"` to int `1` in request parsing. Frontend stores the returned integer as string in localStorage via `JSON.stringify`. This round-trip works transparently.
2. **snake_case/camelCase**: Frontend transforms `snake_case` responses to `camelCase` in `getConversationHistory()`. The `POST /api/chat` response uses `snake_case` (`conversation_id`, `tool_calls`). The GET messages response also uses `snake_case` (`created_at`, `tool_calls`).
3. **tool_calls field**: Backend returns `null` when no tools called (not omitted). Frontend `transformApiResponse()` handles `response.tool_calls?.map(...)` safely.
4. **ToolCall.args**: Both frontend and backend use `args` (not `arguments`). Frontend maps `tc.args` directly from the API response.

---

## MCP Tool Mapping

| User Says | AI Uses Tool | Endpoint Called (internally) |
|-----------|-------------|------------------------------|
| "Add buy groceries" | `add_task` | `POST /api/tasks` equivalent |
| "Show my tasks" | `list_tasks` | `GET /api/tasks` equivalent |
| "Mark task 5 as done" | `complete_task` | `PATCH /api/tasks/5/complete` equivalent |
| "Delete task 3" | `delete_task` | `DELETE /api/tasks/3` equivalent |
| "Change task 2 to Call mom" | `update_task` | `PUT /api/tasks/2` equivalent |

Tools operate on the same `tasks` table as the REST API, ensuring data consistency.

---

## Implementation Dependencies

| Dependency | Status | Required For |
|------------|--------|--------------|
| Better Auth session verification | COMPLETE (`auth.py`) | Authentication |
| Task model + CRUD | COMPLETE (`models.py`, `routes/tasks.py`) | MCP tool operations |
| Database session management | COMPLETE (`database.py`) | Conversation/Message persistence |
| Rate limiter | COMPLETE (`rate_limiter.py`) | Chat rate limiting |
| Conversation model | **NOT BUILT** | Conversation persistence |
| Message model | **NOT BUILT** | Message persistence |
| MCP tools | **NOT BUILT** | AI task operations |
| AI agent | **NOT BUILT** | LLM integration |
| Chat route | **NOT BUILT** | This endpoint |

---

## Related Specifications

- [Database Schema: 003-chat-schema](../database/003-chat-schema.md) - Conversation & Message models
- [MCP Tools: 005-mcp-server](./005-mcp-server.md) - Tool definitions
- [AI Chatbot Spec: 002-ai-chatbot](../002-ai-chatbot/spec.md) - Parent feature spec
- [Chat UI Contract: 005-chat-ui](../005-chat-ui/contracts/chat-api.md) - Frontend API contract
