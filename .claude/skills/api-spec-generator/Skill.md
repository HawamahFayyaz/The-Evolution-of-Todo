---
name: api-spec-generator
description: Generate REST API endpoint specifications with authentication, validation, and error handling
---

# API Spec Generator Skill

## Purpose
Create comprehensive REST API specifications that serve as contracts between frontend and backend, enabling parallel development and preventing integration issues.

## Core Principles
1. **Contract-First**: Define API before implementation
2. **Explicit Everything**: No assumptions about behavior
3. **Error-First Design**: Document all failure modes
4. **Auth-First**: Security is not optional
5. **Idempotency Matters**: State clear expectations

## When to Use
- Phase II and beyond (REST API required)
- Designing new endpoints
- Documenting existing APIs
- Planning MCP tool mappings (Phase III)
- API version migrations

## HTTP Methods Guide

| Method | Use Case | Idempotent? | Request Body? |
|--------|----------|-------------|---------------|
| GET | Retrieve resource(s) | Yes | No |
| POST | Create new resource | No | Yes |
| PUT | Replace entire resource | Yes | Yes |
| PATCH | Update partial resource | No | Yes |
| DELETE | Remove resource | Yes | No |

## Status Codes Guide

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET/PUT/PATCH/DELETE |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE (no body) |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing/invalid auth token |
| 403 | Forbidden | Valid token, insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists (duplicate) |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server-side error |

## Error Response Format (ALWAYS USE THIS)
````json
{
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE",
  "details": {
    "field": "Additional context",
    "suggestion": "How to fix"
  }
}
````

## Complete Endpoint Specification Template
````markdown
### [METHOD] [PATH]

**Purpose**: One-sentence description

**Authentication**: Required/Optional (JWT Bearer token)

**Authorization**: Who can access this endpoint

**Request Headers**:
- `Authorization: Bearer <token>` (required if auth is needed)
- `Content-Type: application/json` (for POST/PUT/PATCH)

**Path Parameters**:
- `user_id` (string, required): Authenticated user's ID
- `task_id` (integer, required): Task identifier

**Query Parameters**:
- `status` (string, optional): Filter by "pending" | "completed" | "all" (default: "all")
- `limit` (integer, optional): Max results (1-100, default: 50)
- `offset` (integer, optional): Pagination offset (default: 0)

**Request Body** (for POST/PUT/PATCH):
```json
{
  "title": "string (1-200 chars, required)",
  "description": "string (max 1000 chars, optional)",
  "due_date": "ISO 8601 datetime (optional)"
}
```

**Response (Success)**:
**Status**: 200 OK
```json
{
  "id": 1,
  "user_id": "user_abc123",
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "created_at": "2025-12-30T10:00:00Z",
  "updated_at": "2025-12-30T10:00:00Z"
}
```

**Response (Errors)**:

**401 Unauthorized** - Missing or invalid token
```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED",
  "details": {
    "suggestion": "Include valid JWT token in Authorization header"
  }
}
```

**404 Not Found** - Task doesn't exist
```json
{
  "error": "Task not found",
  "code": "TASK_NOT_FOUND",
  "details": {
    "task_id": 123
  }
}
```

**422 Unprocessable Entity** - Validation failed
```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "title": "Title is required",
    "title_length": "Title must be 1-200 characters"
  }
}
```

**Idempotency**: [Yes/No] - [Explanation]
Example: "Yes - Multiple identical PUT requests produce same result"

**Rate Limiting**: 100 requests per minute per user

**Performance Expectations**:
- Response time: <200ms at p95
- Timeout: 5 seconds

**Business Rules**:
**ALWAYS:**
- Validate user_id from JWT token matches path parameter
- Filter results by authenticated user
- Use soft delete (set deleted_at, don't hard delete)

**NEVER:**
- Return tasks belonging to other users
- Allow unauthenticated access
- Expose sensitive user data (emails, passwords)

**Edge Cases**:
| Scenario | Status Code | Response |
|----------|-------------|----------|
| Empty title | 422 | {"error": "Title required", "code": "VALIDATION_ERROR"} |
| Title too long | 422 | {"error": "Title max 200 chars", "code": "VALIDATION_ERROR"} |
| Task not found | 404 | {"error": "Task not found", "code": "TASK_NOT_FOUND"} |
| User not authorized | 403 | {"error": "Forbidden", "code": "FORBIDDEN"} |
| Database error | 500 | {"error": "Internal error", "code": "INTERNAL_ERROR"} |

**MCP Tool Mapping** (for Phase III):
This endpoint is called by MCP tool: `add_task`
See: `specs/mcp/add-task-tool.md`
````

## Complete Example: List Tasks
````markdown
### GET /api/{user_id}/tasks

**Purpose**: Retrieve user's tasks with optional filtering and pagination

**Authentication**: Required (JWT Bearer token)

**Authorization**: User can only access their own tasks

**Request Headers**:
- `Authorization: Bearer <access_token>`

**Path Parameters**:
- `user_id` (string, required): Must match authenticated user's ID from JWT

**Query Parameters**:
- `status` (string, optional): "all" | "pending" | "completed" (default: "all")
- `limit` (integer, optional): Max results 1-100 (default: 50)
- `offset` (integer, optional): Pagination offset (default: 0)
- `sort` (string, optional): "created_at" | "updated_at" | "title" (default: "created_at")
- `order` (string, optional): "asc" | "desc" (default: "desc")

**Request Body**: None

**Response (Success)**:
**Status**: 200 OK
```json
{
  "tasks": [
    {
      "id": 1,
      "user_id": "user_abc123",
      "title": "Buy groceries",
      "description": "Milk, eggs, bread",
      "completed": false,
      "created_at": "2025-12-30T10:00:00Z",
      "updated_at": "2025-12-30T10:00:00Z"
    },
    {
      "id": 2,
      "user_id": "user_abc123",
      "title": "Call mom",
      "description": null,
      "completed": true,
      "created_at": "2025-12-29T15:30:00Z",
      "updated_at": "2025-12-30T09:00:00Z"
    }
  ],
  "total": 2,
  "limit": 50,
  "offset": 0
}
```

**Response (Errors)**:

**401 Unauthorized**
```json
{
  "error": "Authentication required",
  "code": "UNAUTHORIZED",
  "details": {
    "suggestion": "Include valid JWT token in Authorization header"
  }
}
```

**403 Forbidden** - user_id in path doesn't match JWT token
```json
{
  "error": "Cannot access other user's tasks",
  "code": "FORBIDDEN",
  "details": {
    "requested_user": "user_xyz",
    "authenticated_user": "user_abc123"
  }
}
```

**400 Bad Request** - Invalid query parameters
```json
{
  "error": "Invalid query parameters",
  "code": "INVALID_PARAMETERS",
  "details": {
    "status": "Must be one of: all, pending, completed",
    "limit": "Must be between 1 and 100"
  }
}
```

**Idempotency**: Yes - Multiple identical GET requests return same data (unless data changes)

**Rate Limiting**: 100 requests per minute per user

**Performance Expectations**:
- Response time: <150ms at p95 for <100 tasks
- Response time: <300ms at p95 for 100+ tasks
- Timeout: 5 seconds

**Business Rules**:
**ALWAYS:**
- Verify user_id in path matches JWT token user_id
- Only return tasks where deleted_at IS NULL (soft delete filter)
- Return empty array if no tasks (not 404)
- Include pagination metadata (total, limit, offset)

**NEVER:**
- Return tasks from other users
- Include deleted tasks (where deleted_at IS NOT NULL)
- Expose internal database errors to client

**Edge Cases**:
| Scenario | Status Code | Response |
|----------|-------------|----------|
| No tasks found | 200 | {"tasks": [], "total": 0, "limit": 50, "offset": 0} |
| Invalid status filter | 400 | {"error": "Invalid status", "code": "INVALID_PARAMETERS"} |
| Limit exceeds 100 | 400 | {"error": "Limit max 100", "code": "INVALID_PARAMETERS"} |
| Offset > total tasks | 200 | {"tasks": [], "total": 50, "limit": 50, "offset": 100} |
| JWT token expired | 401 | {"error": "Token expired", "code": "TOKEN_EXPIRED"} |
| Database timeout | 500 | {"error": "Service unavailable", "code": "INTERNAL_ERROR"} |

**MCP Tool Mapping** (for Phase III):
This endpoint is called by MCP tool: `list_tasks`
See: `specs/mcp/list-tasks-tool.md`

**Caching**:
- Cache-Control: no-cache (data changes frequently)
- ETag supported for conditional requests

**Example Requests**:
```bash
# Get all tasks
GET /api/user_abc123/tasks

# Get pending tasks only
GET /api/user_abc123/tasks?status=pending

# Get first 10 completed tasks, sorted by title
GET /api/user_abc123/tasks?status=completed&limit=10&sort=title&order=asc

# Pagination: Get next 50 tasks
GET /api/user_abc123/tasks?limit=50&offset=50
```
````

## Complete CRUD Specification (All 5 Endpoints)

Create `specs/api/tasks-crud.md` with all operations:

1. **GET /api/{user_id}/tasks** - List tasks
2. **GET /api/{user_id}/tasks/{task_id}** - Get single task
3. **POST /api/{user_id}/tasks** - Create task
4. **PUT /api/{user_id}/tasks/{task_id}** - Update task
5. **DELETE /api/{user_id}/tasks/{task_id}** - Delete task (soft delete)

## Authentication Pattern (JWT)

**All endpoints MUST verify**:
1. Extract `Authorization: Bearer <token>` header
2. Verify JWT signature with secret key
3. Check token expiration
4. Extract `user_id` from token payload
5. Compare with path parameter `user_id`
6. Reject if mismatch (403 Forbidden)

## Validation Rules

### Common Validations
- **Title**: 1-200 characters, required, trimmed
- **Description**: 0-1000 characters, optional, trimmed
- **user_id**: Must match JWT token
- **task_id**: Must be positive integer
- **status**: Must be "pending" or "completed"
- **dates**: ISO 8601 format, UTC timezone

### Field Constraints (use Pydantic)
````python
from pydantic import BaseModel, Field, validator

class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)

    @validator('title')
    def trim_title(cls, v):
        return v.strip()
````

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Missing authentication docs | Every endpoint specifies auth requirements |
| Vague error responses | Document all error codes with examples |
| No validation rules | Specify exact constraints (min/max length, format) |
| Missing idempotency statement | State whether multiple requests have same effect |
| No performance expectations | Set response time targets |
| Inconsistent error format | Always use {error, code, details} format |

## Usage Instructions

### Generate API Spec from Feature Spec
@.claude/skills/api-spec-generator/Skill.md
Generate REST API specification from feature spec:
@specs/features/add-task.md
Include:

All HTTP details (method, path, headers)
Request/response schemas
All error cases with status codes
Authentication requirements
Validation rules
Business rules
Edge cases

Save to: specs/api/add-task-api.md

### Generate Complete CRUD API
@.claude/skills/api-spec-generator/Skill.md
Generate complete CRUD API specification for tasks resource.
Operations needed:

List tasks (GET with filters)
Get single task (GET by ID)
Create task (POST)
Update task (PUT)
Delete task (DELETE - soft delete)

Authentication: JWT Bearer tokens
Base path: /api/{user_id}/tasks
Save to: specs/api/tasks-crud.md
