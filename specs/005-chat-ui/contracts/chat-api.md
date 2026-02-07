# API Contract: Chat UI ↔ Chat API

**Feature**: 005-chat-ui
**Date**: 2026-02-05
**Backend Feature**: 004-chat-api

## Overview

This contract defines the API interface between the Chat UI frontend (005-chat-ui) and the Chat API backend (004-chat-api). Both sides must adhere to this contract for successful integration.

---

## 1. Send Message

### Endpoint

```
POST /api/chat
```

### Headers

| Header | Required | Value |
|--------|----------|-------|
| Authorization | Yes | `Bearer <jwt_token>` |
| Content-Type | Yes | `application/json` |

### Request Body

```json
{
  "conversation_id": "string | null",
  "message": "string"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| conversation_id | string (UUID) | No | If omitted, creates new conversation |
| message | string | Yes | 1-2000 characters, trimmed |

### Success Response (200)

```json
{
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "response": "I've added 'Buy groceries' to your task list.",
  "tool_calls": [
    {
      "tool": "add_task",
      "args": {
        "title": "Buy groceries"
      },
      "result": {
        "task": {
          "id": "123e4567-e89b-12d3-a456-426614174000",
          "title": "Buy groceries",
          "status": "pending"
        },
        "success": true
      }
    }
  ]
}
```

| Field | Type | Always Present |
|-------|------|----------------|
| conversation_id | string (UUID) | Yes |
| response | string | Yes |
| tool_calls | array | No (only when tools were called) |

### Error Responses

#### 401 Unauthorized

```json
{
  "detail": "Not authenticated"
}
```

**Frontend Action**: Redirect to `/login`

#### 404 Not Found

```json
{
  "detail": "Conversation not found"
}
```

**Frontend Action**: Clear conversation_id, start new conversation

#### 422 Validation Error

```json
{
  "detail": [
    {
      "loc": ["body", "message"],
      "msg": "Message cannot be empty",
      "type": "value_error"
    }
  ]
}
```

**Frontend Action**: Show inline validation error

#### 429 Too Many Requests

```json
{
  "detail": "Rate limit exceeded. Please slow down.",
  "retry_after": 30
}
```

**Frontend Action**: Show "Please wait" message, disable input for `retry_after` seconds

#### 500 Internal Server Error

```json
{
  "detail": "An error occurred while processing your request"
}
```

**Frontend Action**: Show friendly error message, offer retry and fallback to tasks view

#### 503 Service Unavailable

```json
{
  "detail": "AI service is temporarily unavailable"
}
```

**Frontend Action**: Show "AI is temporarily unavailable", offer fallback to tasks view

---

## 2. Get Conversation History

### Endpoint

```
GET /api/conversations/{conversation_id}/messages
```

### Path Parameters

| Parameter | Type | Required |
|-----------|------|----------|
| conversation_id | string (UUID) | Yes |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 50 | Maximum messages to return (1-100) |

### Headers

| Header | Required | Value |
|--------|----------|-------|
| Authorization | Yes | `Bearer <jwt_token>` |

### Success Response (200)

```json
[
  {
    "id": "msg-1",
    "role": "user",
    "content": "Add buy groceries to my tasks",
    "tool_calls": null,
    "created_at": "2026-02-05T10:30:00Z"
  },
  {
    "id": "msg-2",
    "role": "assistant",
    "content": "I've added 'Buy groceries' to your task list.",
    "tool_calls": [
      {
        "tool": "add_task",
        "args": { "title": "Buy groceries" },
        "result": { "success": true }
      }
    ],
    "created_at": "2026-02-05T10:30:02Z"
  }
]
```

### Error Responses

#### 401 Unauthorized

Same as Send Message

#### 403 Forbidden

```json
{
  "detail": "You do not have access to this conversation"
}
```

**Frontend Action**: Clear stored conversation_id, start new conversation

#### 404 Not Found

```json
{
  "detail": "Conversation not found"
}
```

**Frontend Action**: Clear stored conversation_id, show empty state

---

## 3. Data Type Definitions

### Message Object

```typescript
interface Message {
  id: string;           // UUID
  role: 'user' | 'assistant';
  content: string;
  tool_calls: ToolCall[] | null;
  created_at: string;   // ISO 8601 datetime
}
```

### ToolCall Object

```typescript
interface ToolCall {
  tool: string;         // Tool identifier
  args: object;         // Arguments passed to tool
  result: object;       // Result from tool execution
}
```

### Known Tool Identifiers

| Tool ID | Description | Expected args |
|---------|-------------|---------------|
| add_task | Create a new task | `{ title, description?, due_date? }` |
| list_tasks | List user's tasks | `{ status?, search?, limit? }` |
| complete_task | Mark task as done | `{ task_id }` |
| delete_task | Soft delete a task | `{ task_id }` |
| update_task | Modify task | `{ task_id, title?, description?, due_date? }` |

---

## 4. Naming Convention Mapping

Backend uses `snake_case`, frontend uses `camelCase`:

| Backend (Python) | Frontend (TypeScript) |
|------------------|----------------------|
| conversation_id | conversationId |
| tool_calls | toolCalls |
| created_at | createdAt |
| task_id | taskId |
| due_date | dueDate |

**Transformation Location**: `frontend/lib/api/chat.ts`

---

## 5. Contract Tests

### Frontend Tests (Jest/Vitest)

```typescript
describe('Chat API Client', () => {
  it('should send message and receive response', async () => {
    const response = await sendMessage({ message: 'Hello' });
    expect(response.conversation_id).toBeDefined();
    expect(response.response).toBeDefined();
  });

  it('should handle validation error', async () => {
    await expect(sendMessage({ message: '' }))
      .rejects.toMatchObject({ status: 422 });
  });

  it('should include tool_calls when present', async () => {
    const response = await sendMessage({ message: 'Add task: test' });
    if (response.tool_calls) {
      expect(response.tool_calls[0].tool).toBe('add_task');
    }
  });
});
```

### Backend Tests (pytest)

```python
def test_send_message_returns_response(client, auth_token):
    response = client.post(
        "/api/chat",
        json={"message": "Hello"},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    assert "conversation_id" in response.json()
    assert "response" in response.json()

def test_send_empty_message_returns_422(client, auth_token):
    response = client.post(
        "/api/chat",
        json={"message": ""},
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 422
```

---

## 6. Change Management

Any changes to this contract require:

1. Update this document
2. Notify both frontend and backend teams
3. Version bump if breaking change
4. Update affected tests
5. Coordinate deployment order (backend first for new fields)
