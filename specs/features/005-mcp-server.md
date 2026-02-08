# MCP Tools Specification: Stateless Task Operations

**Feature Branch**: `005-mcp-tools`
**Created**: 2026-02-08
**Status**: Draft
**Phase**: III (AI-Powered Todo Chatbot)
**Parent Feature**: 002-ai-chatbot
**Generated Using**: `.claude/skills/mcp-tool-builder/`
**Architecture Reference**: `.claude/blueprints/ai-chatbot/`

---

## Overview

Five stateless MCP (Model Context Protocol) tools that wrap existing task CRUD operations for AI agent consumption. All tools operate directly on the `tasks` table in Neon PostgreSQL -- the same table used by the REST API. No in-memory state. Every tool requires `user_id` for multi-user data isolation.

### Design Principles (from Blueprint + Skill)

1. **STATELESS**: No global variables, no in-memory caches. All state lives in the database.
2. **user_id REQUIRED**: Every tool takes `user_id` as a mandatory parameter (injected by the chat endpoint from the JWT session, never from user input).
3. **Structured Returns**: Every tool returns `{ success: bool, ... }` for the AI to interpret.
4. **Soft Deletes Only**: Delete operations set `deleted_at`, never hard delete.
5. **Same Data**: Tools read/write the same `tasks` table as `routes/tasks.py`.

---

## Stateless Architecture Verification Checklist

- [ ] No global variables storing task state
- [ ] All data persisted to PostgreSQL (Neon)
- [ ] Tools work correctly after server restart
- [ ] No in-memory caches between requests
- [ ] Each tool invocation is independent

---

## Tool 1: add_task

**Purpose**: Create a new todo task for the authenticated user.

**Natural Language Triggers**:
```
Use this when user says:
- "Add [task]"
- "Create a task for [task]"
- "Remember to [task]"
- "I need to [task]"
- "Put [task] on my list"
```

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "string",
      "description": "Authenticated user's ID from session token"
    },
    "title": {
      "type": "string",
      "description": "Task title (1-200 characters)",
      "minLength": 1,
      "maxLength": 200
    },
    "description": {
      "type": "string",
      "description": "Optional task details (max 1000 chars)",
      "maxLength": 1000,
      "default": ""
    },
    "due_date": {
      "type": "string",
      "description": "Optional due date in ISO 8601 format",
      "format": "date-time"
    }
  },
  "required": ["user_id", "title"]
}
```

### Function Signature

```python
async def add_task(user_id: str, title: str, description: str = "", due_date: str | None = None) -> dict
```

### Success Response

```json
{
  "success": true,
  "task_id": 42,
  "title": "Buy groceries",
  "description": "",
  "status": "pending",
  "message": "Added task: Buy groceries"
}
```

### Error Responses

```json
{
  "success": false,
  "error": "Title is required",
  "error_code": "VALIDATION_ERROR"
}
```

```json
{
  "success": false,
  "error": "Database error occurred",
  "error_code": "INTERNAL_ERROR"
}
```

### Implementation Notes

```python
async def add_task(user_id: str, title: str, description: str = "", due_date: str | None = None) -> dict:
    """Stateless: creates task directly in database."""
    try:
        with get_session() as session:
            task = Task(
                user_id=user_id,
                title=title.strip(),
                description=description.strip(),
                priority=TaskPriority.MEDIUM,
                due_date=due_date,
            )
            session.add(task)
            session.commit()
            session.refresh(task)

            return {
                "success": True,
                "task_id": task.id,
                "title": task.title,
                "description": task.description,
                "status": "pending",
                "message": f"Added task: {task.title}",
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_code": "INTERNAL_ERROR",
        }
```

---

## Tool 2: list_tasks

**Purpose**: Retrieve the user's tasks with optional status filtering.

**Natural Language Triggers**:
```
Use this when user says:
- "Show my tasks"
- "What's on my list?"
- "Show pending tasks"
- "List completed tasks"
- "What do I need to do?"
- "How many tasks do I have?"
```

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "string",
      "description": "Authenticated user's ID"
    },
    "status": {
      "type": "string",
      "description": "Filter by status: 'all', 'pending', or 'completed'",
      "enum": ["all", "pending", "completed"],
      "default": "all"
    }
  },
  "required": ["user_id"]
}
```

### Function Signature

```python
async def list_tasks(user_id: str, status: str = "all") -> dict
```

### Success Response

```json
{
  "success": true,
  "tasks": [
    {
      "task_id": 42,
      "title": "Buy groceries",
      "description": "",
      "completed": false,
      "priority": "medium",
      "created_at": "2026-02-08T10:00:00Z"
    },
    {
      "task_id": 43,
      "title": "Call mom",
      "description": "Discuss weekend plans",
      "completed": true,
      "priority": "high",
      "created_at": "2026-02-07T15:30:00Z"
    }
  ],
  "count": 2,
  "message": "Found 2 tasks"
}
```

### Empty Response

```json
{
  "success": true,
  "tasks": [],
  "count": 0,
  "message": "No tasks found"
}
```

### Implementation Notes

```python
async def list_tasks(user_id: str, status: str = "all") -> dict:
    """Stateless: queries database each time."""
    try:
        with get_session() as session:
            query = select(Task).where(
                Task.user_id == user_id,
                Task.deleted_at.is_(None),
            )

            if status == "pending":
                query = query.where(Task.completed == False)
            elif status == "completed":
                query = query.where(Task.completed == True)

            query = query.order_by(Task.created_at.desc())
            tasks = session.exec(query).all()

            return {
                "success": True,
                "tasks": [
                    {
                        "task_id": t.id,
                        "title": t.title,
                        "description": t.description,
                        "completed": t.completed,
                        "priority": t.priority.value,
                        "created_at": t.created_at.isoformat(),
                    }
                    for t in tasks
                ],
                "count": len(tasks),
                "message": f"Found {len(tasks)} tasks",
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_code": "INTERNAL_ERROR",
        }
```

---

## Tool 3: complete_task

**Purpose**: Mark a task as completed.

**Natural Language Triggers**:
```
Use this when user says:
- "Mark task [ID] as done"
- "I finished [task]"
- "Complete task [ID]"
- "Task [ID] is done"
- "I bought the [item]" (after listing tasks)
```

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "string",
      "description": "Authenticated user's ID"
    },
    "task_id": {
      "type": "integer",
      "description": "ID of the task to complete"
    }
  },
  "required": ["user_id", "task_id"]
}
```

### Function Signature

```python
async def complete_task(user_id: str, task_id: int) -> dict
```

### Success Response

```json
{
  "success": true,
  "task_id": 42,
  "title": "Buy groceries",
  "status": "completed",
  "completed_at": "2026-02-08T14:30:00Z",
  "message": "Completed: Buy groceries"
}
```

### Error Responses

```json
{
  "success": false,
  "error": "Task not found",
  "error_code": "TASK_NOT_FOUND"
}
```

```json
{
  "success": false,
  "error": "Unauthorized: task belongs to another user",
  "error_code": "UNAUTHORIZED"
}
```

### Already Completed

```json
{
  "success": true,
  "task_id": 42,
  "title": "Buy groceries",
  "status": "completed",
  "message": "Task 'Buy groceries' was already completed"
}
```

### Implementation Notes

```python
async def complete_task(user_id: str, task_id: int) -> dict:
    """Stateless: updates task directly in database."""
    try:
        with get_session() as session:
            task = session.get(Task, task_id)

            if not task or task.deleted_at is not None:
                return {
                    "success": False,
                    "error": "Task not found",
                    "error_code": "TASK_NOT_FOUND",
                }

            if task.user_id != user_id:
                return {
                    "success": False,
                    "error": "Task not found",  # Don't reveal existence
                    "error_code": "TASK_NOT_FOUND",
                }

            if task.completed:
                return {
                    "success": True,
                    "task_id": task.id,
                    "title": task.title,
                    "status": "completed",
                    "message": f"Task '{task.title}' was already completed",
                }

            task.completed = True
            task.updated_at = datetime.now(UTC)
            session.commit()

            return {
                "success": True,
                "task_id": task.id,
                "title": task.title,
                "status": "completed",
                "completed_at": task.updated_at.isoformat(),
                "message": f"Completed: {task.title}",
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_code": "INTERNAL_ERROR",
        }
```

---

## Tool 4: delete_task

**Purpose**: Soft delete a task (sets `deleted_at`, never hard delete per constitution).

**Natural Language Triggers**:
```
Use this when user says:
- "Delete task [ID]"
- "Remove [task]"
- "Get rid of task [ID]"
- "I don't need [task] anymore"
```

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "string",
      "description": "Authenticated user's ID"
    },
    "task_id": {
      "type": "integer",
      "description": "ID of the task to delete"
    }
  },
  "required": ["user_id", "task_id"]
}
```

### Function Signature

```python
async def delete_task(user_id: str, task_id: int) -> dict
```

### Success Response

```json
{
  "success": true,
  "task_id": 42,
  "title": "Buy groceries",
  "message": "Deleted: Buy groceries"
}
```

### Error Responses

```json
{
  "success": false,
  "error": "Task not found",
  "error_code": "TASK_NOT_FOUND"
}
```

### Implementation Notes

```python
async def delete_task(user_id: str, task_id: int) -> dict:
    """Stateless: soft deletes task in database."""
    try:
        with get_session() as session:
            task = session.get(Task, task_id)

            if not task or task.deleted_at is not None:
                return {
                    "success": False,
                    "error": "Task not found",
                    "error_code": "TASK_NOT_FOUND",
                }

            if task.user_id != user_id:
                return {
                    "success": False,
                    "error": "Task not found",
                    "error_code": "TASK_NOT_FOUND",
                }

            # Soft delete - NEVER hard delete
            task.deleted_at = datetime.now(UTC)
            task.updated_at = datetime.now(UTC)
            session.commit()

            return {
                "success": True,
                "task_id": task.id,
                "title": task.title,
                "message": f"Deleted: {task.title}",
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_code": "INTERNAL_ERROR",
        }
```

---

## Tool 5: update_task

**Purpose**: Update a task's title and/or description.

**Natural Language Triggers**:
```
Use this when user says:
- "Change task [ID] to [new title]"
- "Rename task [ID]"
- "Update [task] description"
- "Actually, make that [new title]"
```

### Input Schema

```json
{
  "type": "object",
  "properties": {
    "user_id": {
      "type": "string",
      "description": "Authenticated user's ID"
    },
    "task_id": {
      "type": "integer",
      "description": "ID of the task to update"
    },
    "title": {
      "type": "string",
      "description": "New task title (optional, 1-200 chars)",
      "minLength": 1,
      "maxLength": 200
    },
    "description": {
      "type": "string",
      "description": "New description (optional, max 1000 chars)",
      "maxLength": 1000
    },
    "due_date": {
      "type": "string",
      "description": "New due date in ISO 8601 format (optional)",
      "format": "date-time"
    }
  },
  "required": ["user_id", "task_id"]
}
```

### Function Signature

```python
async def update_task(
    user_id: str,
    task_id: int,
    title: str | None = None,
    description: str | None = None,
    due_date: str | None = None,
) -> dict
```

### Success Response

```json
{
  "success": true,
  "task_id": 42,
  "title": "Buy organic groceries",
  "description": "From the farmers market",
  "updated_at": "2026-02-08T14:30:00Z",
  "message": "Updated: Buy organic groceries"
}
```

### Error Responses

```json
{
  "success": false,
  "error": "Task not found",
  "error_code": "TASK_NOT_FOUND"
}
```

```json
{
  "success": false,
  "error": "No fields to update",
  "error_code": "VALIDATION_ERROR"
}
```

### Implementation Notes

```python
async def update_task(
    user_id: str,
    task_id: int,
    title: str | None = None,
    description: str | None = None,
    due_date: str | None = None,
) -> dict:
    """Stateless: updates task fields in database."""
    try:
        if title is None and description is None and due_date is None:
            return {
                "success": False,
                "error": "No fields to update",
                "error_code": "VALIDATION_ERROR",
            }

        with get_session() as session:
            task = session.get(Task, task_id)

            if not task or task.deleted_at is not None:
                return {
                    "success": False,
                    "error": "Task not found",
                    "error_code": "TASK_NOT_FOUND",
                }

            if task.user_id != user_id:
                return {
                    "success": False,
                    "error": "Task not found",
                    "error_code": "TASK_NOT_FOUND",
                }

            if title is not None:
                task.title = title.strip()
            if description is not None:
                task.description = description.strip()
            if due_date is not None:
                task.due_date = due_date

            task.updated_at = datetime.now(UTC)
            session.commit()
            session.refresh(task)

            return {
                "success": True,
                "task_id": task.id,
                "title": task.title,
                "description": task.description,
                "updated_at": task.updated_at.isoformat(),
                "message": f"Updated: {task.title}",
            }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_code": "INTERNAL_ERROR",
        }
```

---

## Natural Language Trigger Mapping (Summary)

| User Says | Tool | Key Parameters |
|-----------|------|----------------|
| "Add buy groceries" | `add_task` | title="Buy groceries" |
| "Add buy milk, need 2 gallons" | `add_task` | title="Buy milk", description="Need 2 gallons" |
| "Show my tasks" | `list_tasks` | status="all" |
| "Show pending tasks" | `list_tasks` | status="pending" |
| "What's completed?" | `list_tasks` | status="completed" |
| "Mark task 5 as done" | `complete_task` | task_id=5 |
| "I finished the groceries" | `complete_task` | (AI resolves to task_id) |
| "Delete task 3" | `delete_task` | task_id=3 |
| "Remove the milk task" | `delete_task` | (AI resolves to task_id) |
| "Change task 2 to Call mom" | `update_task` | task_id=2, title="Call mom" |
| "Add a note to task 1: urgent" | `update_task` | task_id=1, description="urgent" |

---

## Error Codes Reference

| Code | Meaning | AI Should Tell User |
|------|---------|---------------------|
| `TASK_NOT_FOUND` | Task doesn't exist or is deleted | "I couldn't find that task." |
| `UNAUTHORIZED` | Task belongs to another user | "I couldn't find that task." (same as not found) |
| `VALIDATION_ERROR` | Invalid input parameters | "Please provide a valid [field]." |
| `INTERNAL_ERROR` | Database or system error | "Something went wrong. Please try again." |

---

## Security Rules

1. **user_id injection**: The chat endpoint injects `user_id` from the session token into every tool call. The AI agent NEVER determines `user_id` -- it's always system-provided.
2. **Ownership verification**: Every tool verifies `task.user_id == user_id` before any modification.
3. **Enumeration prevention**: Failed ownership checks return "Task not found" (not "Unauthorized") to prevent task ID enumeration.
4. **Input validation**: Title length (1-200), description length (0-1000) enforced at tool level.

---

## Related Specifications

- [Chat API: 004-chat-api](./004-chat-api.md) - Endpoint that invokes these tools
- [Database Schema: 003-chat-schema](../database/003-chat-schema.md) - Conversation & Message models
- [AI Chatbot Spec: 002-ai-chatbot](../002-ai-chatbot/spec.md) - Parent feature spec
- [MCP Tool Builder Skill](../../.claude/skills/mcp-tool-builder/Skill.md) - Code generation patterns
