---
name: mcp-tool-builder
description: Generate stateless MCP tool definitions for OpenAI Agents SDK integration
---

# MCP Tool Builder Skill

## Purpose
Create Model Context Protocol (MCP) tools for Phase III AI chatbot that are stateless, database-backed, and agent-friendly.

## Core Rules (NEVER BREAK)
1. **Tools MUST be stateless** - no in-memory state, always use database
2. **user_id is ALWAYS required** - for multi-user apps
3. **Return structured dicts** - consistent success/error format
4. **Docstrings guide the agent** - clear description of when to use tool
5. **Map to REST API endpoints** - tools are thin wrappers

## When to Use
- Phase III: Building AI chatbot with OpenAI Agents SDK
- Defining tools that agents can call
- Creating natural language interfaces for CRUD operations
- Wrapping REST APIs for LLM consumption

## Complete MCP Server Example
```python
# mcp_server/server.py
from mcp.server import Server, Tool
from sqlmodel import Session, select
from datetime import datetime, timezone
from typing import Optional
from models import Task, User  # Your SQLModel classes
from database import get_session

# Initialize MCP server
server = Server("todo-mcp-server")

# ==================== TOOL 1: Add Task ====================

add_task_tool = Tool(
    name="add_task",
    description="""Create a new todo task for the user.

    Use this when user says:
    - "Add [task]"
    - "Create a task for [task]"
    - "Remember to [task]"
    - "I need to [task]"
    """,
    inputSchema={
        "type": "object",
        "properties": {
            "user_id": {
                "type": "string",
                "description": "Authenticated user's ID from JWT token"
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
                "maxLength": 1000
            },
            "due_date": {
                "type": "string",
                "description": "Optional due date in ISO 8601 format",
                "format": "date-time"
            }
        },
        "required": ["user_id", "title"]
    }
)

@server.tool(add_task_tool)
async def handle_add_task(
    user_id: str,
    title: str,
    description: Optional[str] = None,
    due_date: Optional[str] = None
):
    """Stateless handler: Store in database, not memory"""
    try:
        with get_session() as session:
            # Verify user exists
            user = session.get(User, user_id)
            if not user or user.deleted_at is not None:
                return {
                    "success": False,
                    "error": "User not found",
                    "error_code": "USER_NOT_FOUND"
                }

            # Create task
            task = Task(
                user_id=user_id,
                title=title,
                description=description,
                due_date=due_date,
                completed=False
            )
            session.add(task)
            session.commit()
            session.refresh(task)

            return {
                "success": True,
                "task": {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "completed": task.completed,
                    "created_at": task.created_at.isoformat()
                },
                "message": f"✅ Added task: {task.title}"
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_code": "INTERNAL_ERROR"
        }

# ==================== TOOL 2: List Tasks ====================

list_tasks_tool = Tool(
    name="list_tasks",
    description="""Retrieve user's todo tasks with optional filtering.

    Use this when user says:
    - "Show my tasks"
    - "What's on my list?"
    - "Show pending tasks"
    - "List completed tasks"
    - "What do I need to do?"
    """,
    inputSchema={
        "type": "object",
        "properties": {
            "user_id": {
                "type": "string",
                "description": "Authenticated user's ID"
            },
            "completed": {
                "type": "boolean",
                "description": "Filter by completion status (optional)"
            },
            "limit": {
                "type": "integer",
                "description": "Max tasks to return (default 50)",
                "minimum": 1,
                "maximum": 100,
                "default": 50
            }
        },
        "required": ["user_id"]
    }
)

@server.tool(list_tasks_tool)
async def handle_list_tasks(
    user_id: str,
    completed: Optional[bool] = None,
    limit: int = 50
):
    """Fetch tasks from database (stateless)"""
    try:
        with get_session() as session:
            # Build query
            statement = select(Task).where(
                Task.user_id == user_id,
                Task.deleted_at.is_(None)  # Only active tasks
            )

            # Apply filters
            if completed is not None:
                statement = statement.where(Task.completed == completed)

            statement = statement.order_by(Task.created_at.desc()).limit(limit)

            tasks = session.exec(statement).all()

            return {
                "success": True,
                "tasks": [
                    {
                        "id": task.id,
                        "title": task.title,
                        "description": task.description,
                        "completed": task.completed,
                        "created_at": task.created_at.isoformat()
                    }
                    for task in tasks
                ],
                "count": len(tasks),
                "message": f"Found {len(tasks)} tasks"
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_code": "INTERNAL_ERROR"
        }

# ==================== TOOL 3: Complete Task ====================

complete_task_tool = Tool(
    name="complete_task",
    description="""Mark a task as completed.

    Use this when user says:
    - "Mark task [ID] as done"
    - "I finished [task]"
    - "Complete task [ID]"
    - "Task [ID] is done"
    """,
    inputSchema={
        "type": "object",
        "properties": {
            "user_id": {
                "type": "string",
                "description": "Authenticated user's ID"
            },
            "task_id": {
                "type": "integer",
                "description": "ID of task to complete"
            }
        },
        "required": ["user_id", "task_id"]
    }
)

@server.tool(complete_task_tool)
async def handle_complete_task(user_id: str, task_id: int):
    """Update task in database (stateless)"""
    try:
        with get_session() as session:
            # Fetch task
            task = session.get(Task, task_id)

            # Validate
            if not task or task.deleted_at is not None:
                return {
                    "success": False,
                    "error": "Task not found",
                    "error_code": "TASK_NOT_FOUND"
                }

            if task.user_id != user_id:
                return {
                    "success": False,
                    "error": "Unauthorized",
                    "error_code": "UNAUTHORIZED"
                }

            if task.completed:
                return {
                    "success": True,
                    "message": f"Task '{task.title}' was already completed",
                    "task_id": task.id
                }

            # Mark complete
            task.completed = True
            task.updated_at = datetime.now(timezone.utc)
            session.commit()

            return {
                "success": True,
                "task_id": task.id,
                "message": f"✅ Completed: {task.title}"
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_code": "INTERNAL_ERROR"
        }

# ==================== TOOL 4: Delete Task ====================

delete_task_tool = Tool(
    name="delete_task",
    description="""Soft delete a task (sets deleted_at, doesn't remove from DB).

    Use this when user says:
    - "Delete task [ID]"
    - "Remove [task]"
    - "Get rid of task [ID]"
    """,
    inputSchema={
        "type": "object",
        "properties": {
            "user_id": {
                "type": "string",
                "description": "Authenticated user's ID"
            },
            "task_id": {
                "type": "integer",
                "description": "ID of task to delete"
            }
        },
        "required": ["user_id", "task_id"]
    }
)

@server.tool(delete_task_tool)
async def handle_delete_task(user_id: str, task_id: int):
    """Soft delete task (stateless)"""
    try:
        with get_session() as session:
            task = session.get(Task, task_id)

            if not task or task.deleted_at is not None:
                return {
                    "success": False,
                    "error": "Task not found",
                    "error_code": "TASK_NOT_FOUND"
                }

            if task.user_id != user_id:
                return {
                    "success": False,
                    "error": "Unauthorized",
                    "error_code": "UNAUTHORIZED"
                }

            # Soft delete
            task.deleted_at = datetime.now(timezone.utc)
            task.updated_at = datetime.now(timezone.utc)
            session.commit()

            return {
                "success": True,
                "task_id": task.id,
                "message": f"🗑️ Deleted: {task.title}"
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_code": "INTERNAL_ERROR"
        }

# ==================== TOOL 5: Update Task ====================

update_task_tool = Tool(
    name="update_task",
    description="""Update task title, description, or due date.

    Use this when user says:
    - "Change task [ID] to [new title]"
    - "Update [task] description"
    - "Rename task [ID]"
    """,
    inputSchema={
        "type": "object",
        "properties": {
            "user_id": {
                "type": "string",
                "description": "Authenticated user's ID"
            },
            "task_id": {
                "type": "integer",
                "description": "ID of task to update"
            },
            "title": {
                "type": "string",
                "description": "New task title (optional)",
                "maxLength": 200
            },
            "description": {
                "type": "string",
                "description": "New description (optional)",
                "maxLength": 1000
            },
            "due_date": {
                "type": "string",
                "description": "New due date ISO 8601 (optional)",
                "format": "date-time"
            }
        },
        "required": ["user_id", "task_id"]
    }
)

@server.tool(update_task_tool)
async def handle_update_task(
    user_id: str,
    task_id: int,
    title: Optional[str] = None,
    description: Optional[str] = None,
    due_date: Optional[str] = None
):
    """Update task fields (stateless)"""
    try:
        with get_session() as session:
            task = session.get(Task, task_id)

            if not task or task.deleted_at is not None:
                return {
                    "success": False,
                    "error": "Task not found",
                    "error_code": "TASK_NOT_FOUND"
                }

            if task.user_id != user_id:
                return {
                    "success": False,
                    "error": "Unauthorized",
                    "error_code": "UNAUTHORIZED"
                }

            # Update fields
            if title:
                task.title = title
            if description is not None:
                task.description = description
            if due_date:
                task.due_date = due_date

            task.updated_at = datetime.now(timezone.utc)
            session.commit()
            session.refresh(task)

            return {
                "success": True,
                "task": {
                    "id": task.id,
                    "title": task.title,
                    "description": task.description,
                    "completed": task.completed
                },
                "message": f"✏️ Updated: {task.title}"
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_code": "INTERNAL_ERROR"
        }

# ==================== Server Startup ====================

if __name__ == "__main__":
    import asyncio

    async def main():
        async with server:
            print("🚀 MCP Server running with 5 tools")
            print("Tools: add_task, list_tasks, complete_task, delete_task, update_task")
            await server.wait_for_shutdown()

    asyncio.run(main())
```

## Natural Language Trigger Mapping

| User Says | Agent Uses Tool | Parameters |
|-----------|----------------|------------|
| "Add buy groceries" | `add_task` | title="Buy groceries" |
| "Show my tasks" | `list_tasks` | (no filters) |
| "Show pending tasks" | `list_tasks` | completed=false |
| "Mark task 5 as done" | `complete_task` | task_id=5 |
| "Delete task 3" | `delete_task` | task_id=3 |
| "Change task 2 to Call mom" | `update_task` | task_id=2, title="Call mom" |

## OpenAI Agents SDK Integration
```python
# agent.py
from openai import OpenAI
from mcp_server.server import server

client = OpenAI(api_key="your-key")

# Convert MCP tools to OpenAI format
openai_tools = [
    {
        "type": "function",
        "function": {
            "name": tool.name,
            "description": tool.description,
            "parameters": tool.inputSchema
        }
    }
    for tool in server.tools
]

# Create agent
assistant = client.beta.assistants.create(
    model="gpt-4o",
    instructions="""You are a helpful todo assistant.
    Use the available tools to help users manage their tasks.
    Always confirm actions with friendly messages.""",
    tools=openai_tools
)
```

## Stateless Architecture Pattern

**❌ WRONG (Stateful):**
```python
# DON'T DO THIS - State lost on restart!
tasks_in_memory = []

@server.tool(add_task_tool)
async def handle_add_task(title: str):
    task = {"id": len(tasks_in_memory) + 1, "title": title}
    tasks_in_memory.append(task)  # ❌ Lost on restart!
    return task
```

**✅ CORRECT (Stateless):**
```python
# DO THIS - State in database
@server.tool(add_task_tool)
async def handle_add_task(user_id: str, title: str):
    with get_session() as session:
        task = Task(user_id=user_id, title=title)
        session.add(task)
        session.commit()  # ✅ Persisted in DB
        return {"id": task.id, "title": task.title}
```

## Error Handling Best Practices

**Consistent Error Format:**
```python
{
    "success": False,
    "error": "Human-readable error message",
    "error_code": "MACHINE_READABLE_CODE"
}
```

**Common Error Codes:**
- `USER_NOT_FOUND`: Invalid user_id
- `TASK_NOT_FOUND`: Task doesn't exist or is deleted
- `UNAUTHORIZED`: User doesn't own this task
- `VALIDATION_ERROR`: Invalid input parameters
- `INTERNAL_ERROR`: Database or system error

## Common Mistakes ❌

| Mistake | Fix |
|---------|-----|
| ❌ Tool stores state in memory | ✅ Always use database for persistence |
| ❌ Missing `user_id` parameter | ✅ Every tool needs user_id for multi-user apps |
| ❌ Inconsistent return format | ✅ Always return `{success, ...}` dict |
| ❌ Vague tool descriptions | ✅ Include natural language triggers in docstring |
| ❌ No error handling | ✅ Try-catch with user-friendly error messages |
| ❌ Hard deletes | ✅ Use soft delete (set deleted_at) |

## Testing MCP Tools
```python
# test_mcp_tools.py
import pytest
from mcp_server.server import handle_add_task, handle_list_tasks

@pytest.mark.asyncio
async def test_add_task():
    result = await handle_add_task(
        user_id="user_123",
        title="Test task"
    )

    assert result["success"] is True
    assert result["task"]["title"] == "Test task"
    assert "id" in result["task"]

@pytest.mark.asyncio
async def test_list_tasks_filters_by_user():
    # Add task for user_123
    await handle_add_task(user_id="user_123", title="Task A")

    # Add task for user_456
    await handle_add_task(user_id="user_456", title="Task B")

    # List tasks for user_123
    result = await handle_list_tasks(user_id="user_123")

    assert result["success"] is True
    assert len(result["tasks"]) == 1
    assert result["tasks"][0]["title"] == "Task A"
```
