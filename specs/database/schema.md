# Database Schema: Task Data Model

**Version**: 1.0.0 (Phase I - In-Memory)
**Created**: 2026-01-01
**Feature Branch**: `003-task-schema`
**Full Specification**: [../003-task-schema/spec.md](../003-task-schema/spec.md)

## Overview

This document defines the Task data model schema for Phase I (in-memory storage) with migration path to Phase II (PostgreSQL).

## Task Entity

### Field Definitions

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| `id` | int | Yes (auto) | Auto-increment | Positive integer, unique | Unique task identifier |
| `title` | str | Yes | - | 1-200 characters | Task title/summary |
| `description` | str | No | `""` | 0-1000 characters | Detailed task information |
| `completed` | bool | Yes | `False` | True/False | Task completion status |
| `created_at` | datetime | Yes (auto) | Current UTC | ISO 8601 format | Creation timestamp |
| `updated_at` | datetime | Yes (auto) | Current UTC | ISO 8601 format | Last modification timestamp |

### Field Details

#### id
- **Type**: Positive integer
- **Generation**: Auto-incremented, starting from 1
- **Uniqueness**: Guaranteed unique, never reused
- **Mutability**: Immutable after creation

#### title
- **Type**: String
- **Constraints**: Non-empty, 1-200 characters
- **Validation**: Whitespace-only strings are rejected
- **Example**: `"Buy groceries"`

#### description
- **Type**: String
- **Constraints**: 0-1000 characters
- **Default**: Empty string `""`
- **Example**: `"Get milk, eggs, bread from the store"`

#### completed
- **Type**: Boolean
- **Default**: `False` (pending)
- **Values**: `True` (complete) or `False` (pending)

#### created_at
- **Type**: Datetime (UTC)
- **Format**: ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`)
- **Generation**: Set automatically on task creation
- **Mutability**: Immutable after creation

#### updated_at
- **Type**: Datetime (UTC)
- **Format**: ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`)
- **Generation**: Set automatically on creation and every update
- **Behavior**: Updates on any field change

## Storage Implementation

### Phase I: In-Memory (Current)

```
Storage Structure:
├── tasks: Dict[int, Task]     # Primary storage {id: task}
└── next_id: int               # ID counter (starts at 1)
```

**Characteristics**:
- O(1) lookup by ID
- Sequential ID generation
- Data lost on application exit
- Single-user, single-session

### Phase II: PostgreSQL (Future)

```sql
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT DEFAULT '',
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
```

## Example Data

### Single Task Object

```json
{
    "id": 1,
    "title": "Buy groceries",
    "description": "Get milk, eggs, bread from the store",
    "completed": false,
    "created_at": "2026-01-01T10:00:00Z",
    "updated_at": "2026-01-01T10:00:00Z"
}
```

### Task After Completion

```json
{
    "id": 1,
    "title": "Buy groceries",
    "description": "Get milk, eggs, bread from the store",
    "completed": true,
    "created_at": "2026-01-01T10:00:00Z",
    "updated_at": "2026-01-01T14:30:00Z"
}
```

### Storage State

```json
{
    "tasks": {
        "1": {
            "id": 1,
            "title": "Buy groceries",
            "description": "Get milk, eggs, bread",
            "completed": true,
            "created_at": "2026-01-01T10:00:00Z",
            "updated_at": "2026-01-01T14:30:00Z"
        },
        "2": {
            "id": 2,
            "title": "Call mom",
            "description": "",
            "completed": false,
            "created_at": "2026-01-01T11:00:00Z",
            "updated_at": "2026-01-01T11:00:00Z"
        }
    },
    "next_id": 3
}
```

## Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| title | Not empty | "Title is required" |
| title | Max 200 chars | "Title must be 1-200 characters" |
| title | Not whitespace-only | "Title is required" |
| description | Max 1000 chars | "Description must be 0-1000 characters" |
| id (lookup) | Positive integer | "Invalid task ID" |
| id (lookup) | Must exist | "Task not found" |

## Migration Notes

### Phase I → Phase II Migration

1. **Schema Changes**:
   - Add `user_id` foreign key (required for multi-user)
   - Add `deleted_at` for soft delete support
   - Convert to SQLModel class

2. **Data Preservation**:
   - Existing ID sequences preserved
   - Timestamps remain in UTC
   - No data transformation needed for core fields

3. **New Constraints**:
   - All tasks must have valid user_id
   - Soft delete replaces hard delete
   - Database-level validation

## Related Specifications

- [Task CRUD Operations](../002-task-crud/spec.md) - Operations using this schema
- [Project Overview](../001-todo-console-app/spec.md) - Phase I overview
