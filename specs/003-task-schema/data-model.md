# Data Model: Todo Console App (Phase I)

**Feature Branch**: `003-task-schema`
**Date**: 2026-01-01
**Source**: specs/003-task-schema/spec.md, specs/database/schema.md

## Entity: Task

### Fields

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `id` | `int` | Auto | Auto-increment | Positive, unique | Unique task identifier |
| `title` | `str` | Yes | - | 1-200 chars, non-empty | Task title/summary |
| `description` | `str` | No | `""` | 0-1000 chars | Detailed information |
| `completed` | `bool` | Yes | `False` | True/False | Completion status |
| `created_at` | `datetime` | Auto | `datetime.now(UTC)` | ISO 8601 UTC | Creation timestamp |
| `updated_at` | `datetime` | Auto | `datetime.now(UTC)` | ISO 8601 UTC | Last modification |

### State Transitions

```
┌─────────────────────────────────────────────────────────┐
│                     Task Lifecycle                       │
└─────────────────────────────────────────────────────────┘

   ┌─────────┐    complete     ┌───────────┐
   │ PENDING │ ──────────────► │ COMPLETED │
   │  (new)  │ ◄────────────── │           │
   └─────────┘    complete     └───────────┘
        │          (toggle)
        │
        │ delete
        ▼
   ┌─────────┐
   │ DELETED │  (removed from active list)
   └─────────┘
```

### Validation Rules

```python
# Title Validation
def validate_title(title: str) -> Result:
    if not title or not title.strip():
        return Result(False, "Error: Title is required")
    if len(title) > 200:
        return Result(False, "Error: Title must be 1-200 characters")
    return Result(True, "Valid")

# Description Validation
def validate_description(description: str) -> Result:
    if len(description) > 1000:
        return Result(False, "Error: Description must be 0-1000 characters")
    return Result(True, "Valid")

# ID Validation
def validate_id(id_str: str) -> Result:
    try:
        id_val = int(id_str)
        if id_val <= 0:
            return Result(False, "Error: Invalid task ID. ID must be a positive number")
        return Result(True, "Valid", id_val)
    except ValueError:
        return Result(False, "Error: Invalid task ID. ID must be a positive number")
```

---

## Entity: TaskStorage

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `_tasks` | `dict[int, Task]` | Primary storage {id: Task} |
| `_next_id` | `int` | Counter for next ID (starts at 1) |

### Operations

| Operation | Input | Output | Complexity |
|-----------|-------|--------|------------|
| `add(title, description)` | str, str | Task | O(1) |
| `get(id)` | int | Task \| None | O(1) |
| `list(filter)` | str \| None | list[Task] | O(n) |
| `update(id, title, desc)` | int, str, str | Result | O(1) |
| `delete(id)` | int | Result | O(1) |
| `toggle_complete(id)` | int | Result | O(1) |
| `count()` | - | tuple[int,int,int] | O(n) |

### Invariants

1. `_next_id` always > max(task.id for all tasks)
2. All task IDs are unique
3. No ID is ever reused
4. All timestamps are UTC
5. `updated_at >= created_at` always

---

## Entity: Result

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | `bool` | Whether operation succeeded |
| `message` | `str` | Human-readable status message |
| `data` | `Any` | Optional payload (Task, list, etc.) |

### Usage Pattern

```python
# Success case
Result(success=True, message="Task 1 created successfully", data=task)

# Error case
Result(success=False, message="Error: Task not found. Use 'list' to see available tasks")
```

---

## Entity: Command (Abstract)

### Hierarchy

```
Command (base)
├── AddCommand
├── ListCommand
├── UpdateCommand
├── DeleteCommand
├── CompleteCommand
└── HelpCommand
```

### Interface

| Method | Input | Output | Description |
|--------|-------|--------|-------------|
| `execute(*args)` | tuple[str, ...] | Result | Run command with arguments |
| `help()` | - | str | Return usage information |
| `name` | property | str | Command name for routing |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Data Flow Diagram                           │
└─────────────────────────────────────────────────────────────────────┘

User Input                    Command Layer                 Storage Layer
    │                              │                              │
    │  "add 'Buy groceries'"       │                              │
    ├──────────────────────────────►                              │
    │                              │                              │
    │                   ┌──────────┴──────────┐                   │
    │                   │   Parse & Validate   │                   │
    │                   │   - shlex.split()    │                   │
    │                   │   - validate_title() │                   │
    │                   └──────────┬──────────┘                   │
    │                              │                              │
    │                              │  storage.add(title, desc)    │
    │                              ├──────────────────────────────►
    │                              │                              │
    │                              │     ┌────────────────────────┤
    │                              │     │  - Generate ID         │
    │                              │     │  - Set timestamps      │
    │                              │     │  - Create Task         │
    │                              │     │  - Store in dict       │
    │                              │     └────────────────────────┤
    │                              │                              │
    │                              │◄──────────────────────────────
    │                              │         Task object          │
    │                   ┌──────────┴──────────┐                   │
    │                   │   Format Response    │                   │
    │                   │   Result(success,    │                   │
    │                   │          message,    │                   │
    │                   │          data)       │                   │
    │                   └──────────┬──────────┘                   │
    │                              │                              │
    │◄──────────────────────────────                              │
    │     "Task 1 created"         │                              │
    │                              │                              │
```

---

## Serialization

### Task to Display String

```python
def format_task_row(task: Task) -> str:
    status = "[x]" if task.completed else "[ ]"
    desc = task.description[:30] + "..." if len(task.description) > 30 else task.description
    return f"{task.id:3} {status} {task.title[:40]:<40} {desc}"
```

### Task to Detail View

```python
def format_task_detail(task: Task) -> str:
    return f"""
ID:          {task.id}
Title:       {task.title}
Description: {task.description or '(none)'}
Status:      {'Completed' if task.completed else 'Pending'}
Created:     {task.created_at.isoformat()}
Updated:     {task.updated_at.isoformat()}
"""
```

---

## Migration Path (Phase II)

| Phase I | Phase II |
|---------|----------|
| `@dataclass Task` | `class Task(SQLModel, table=True)` |
| `dict[int, Task]` | PostgreSQL table |
| `_next_id` counter | `SERIAL PRIMARY KEY` |
| `completed: bool` | `completed: bool = Field(default=False, index=True)` |
| - | `user_id: int = Field(foreign_key="users.id")` |
| - | `deleted_at: datetime | None = Field(default=None)` |
