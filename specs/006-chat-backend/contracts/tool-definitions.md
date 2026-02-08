# Tool Contract: MCP Function Tools

**Branch**: `006-chat-backend` | **Date**: 2026-02-08
**Source**: `specs/features/005-mcp-server.md`

---

## Tool Registry

All tools are `@function_tool` decorated Python functions in `backend/agent/tools.py`.

| Tool | Parameters | Returns |
|------|-----------|---------|
| `add_task` | user_id, title, description="", due_date? | `{success, task_id, title, status}` |
| `list_tasks` | user_id, status="all" | `{success, tasks[], count}` |
| `complete_task` | user_id, task_id | `{success, task_id, title, status}` |
| `delete_task` | user_id, task_id | `{success, task_id, title}` |
| `update_task` | user_id, task_id, title?, description?, due_date? | `{success, task_id, title, updated_at}` |

## user_id Injection Pattern

The chat endpoint creates tool functions with `user_id` bound via closure. The AI agent does NOT receive `user_id` as a callable parameter -- it's injected automatically.

```python
# In chat route handler:
def create_tools_for_user(user_id: str, session: Session):
    @function_tool
    def add_task(title: str, description: str = "") -> dict:
        """Create a new todo task."""
        task = Task(user_id=user_id, title=title.strip(), ...)
        session.add(task)
        session.commit()
        ...
    return [add_task, list_tasks, complete_task, delete_task, update_task]
```

## Error Return Format

All tools return `dict` with consistent structure:

**Success**: `{"success": True, "task_id": 42, "title": "...", ...}`
**Error**: `{"success": False, "error": "...", "error_code": "TASK_NOT_FOUND"}`

Error codes: `TASK_NOT_FOUND`, `VALIDATION_ERROR`, `INTERNAL_ERROR`

## Security

- `user_id` from session token, NEVER from AI agent
- Ownership check: `task.user_id != user_id` returns "Task not found" (prevents enumeration)
- Soft deletes only: `deleted_at = datetime.now(UTC)`
