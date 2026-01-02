# Feature Specification: Task Data Model (Phase I)

**Feature Branch**: `003-task-schema`
**Created**: 2026-01-01
**Status**: Draft
**Input**: User description: "Task Data Model Schema for Phase I In-Memory Storage"

## Overview

This specification defines the Task data model for Phase I of the Evolution of Todo project. The model uses in-memory storage (Python data structures) and is designed for future migration to PostgreSQL in Phase II.

## Constitution Alignment

- **Cloud-Native Ready**: Design for statelessness with clear data boundaries
- **Progressive Enhancement**: Schema designed for seamless migration to database in Phase II
- **Quality Over Speed**: Proper validation and data integrity from day one

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Task Creation with Valid Data (Priority: P1)

AS A system
I WANT TO create task records with proper data structure
SO THAT all task information is consistently stored and retrievable

**Why this priority**: Task creation is the foundation. Without proper data structure, no operations can function correctly.

**Independent Test**: Can be tested by creating a task and verifying all fields are populated correctly with proper types and defaults.

**Acceptance Scenarios**:

1. **Given** a user provides a valid title, **When** a task is created, **Then** the task has a unique auto-incremented ID
2. **Given** a user provides a valid title, **When** a task is created, **Then** created_at is set to current UTC timestamp
3. **Given** a user provides a valid title, **When** a task is created, **Then** updated_at equals created_at initially
4. **Given** a user provides a valid title, **When** a task is created, **Then** completed is set to False by default
5. **Given** a user provides no description, **When** a task is created, **Then** description is set to empty string

---

### User Story 2 - Task Data Validation (Priority: P1)

AS A system
I WANT TO validate all task data before storage
SO THAT data integrity is maintained

**Why this priority**: Validation prevents corrupt data that would cause errors throughout the application.

**Independent Test**: Can be tested by attempting to create tasks with invalid data and verifying rejection with appropriate errors.

**Acceptance Scenarios**:

1. **Given** a title with 0 characters (empty), **When** validation runs, **Then** the operation is rejected with "Title is required"
2. **Given** a title with 201 characters, **When** validation runs, **Then** the operation is rejected with "Title must be 1-200 characters"
3. **Given** a description with 1001 characters, **When** validation runs, **Then** the operation is rejected with "Description must be 0-1000 characters"
4. **Given** a valid title of 200 characters, **When** validation runs, **Then** the operation succeeds
5. **Given** a valid description of 1000 characters, **When** validation runs, **Then** the operation succeeds

---

### User Story 3 - Task Updates with Timestamp Tracking (Priority: P2)

AS A system
I WANT TO track when tasks are modified
SO THAT users and future features can see task history

**Why this priority**: Timestamp tracking is essential for sorting and future audit features.

**Independent Test**: Can be tested by updating a task and verifying updated_at changes while created_at remains unchanged.

**Acceptance Scenarios**:

1. **Given** an existing task, **When** any field is updated, **Then** updated_at is set to current UTC timestamp
2. **Given** an existing task, **When** updated, **Then** created_at remains unchanged
3. **Given** an existing task, **When** updated, **Then** the ID remains unchanged
4. **Given** a task marked complete, **When** toggled, **Then** completed changes to True and updated_at changes

---

### User Story 4 - Task Retrieval and Lookup (Priority: P2)

AS A system
I WANT TO retrieve tasks efficiently by ID
SO THAT operations can access task data quickly

**Why this priority**: Efficient lookup is required for all read and update operations.

**Independent Test**: Can be tested by storing tasks and retrieving them by ID, verifying O(1) lookup.

**Acceptance Scenarios**:

1. **Given** a task exists with ID 5, **When** retrieving by ID 5, **Then** the correct task is returned
2. **Given** no task exists with ID 999, **When** retrieving by ID 999, **Then** None/null is returned
3. **Given** multiple tasks exist, **When** listing all tasks, **Then** all tasks are returned

---

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| ID counter at maximum int | System handles gracefully (unlikely in Phase I) |
| Concurrent ID generation | In-memory is single-threaded, no conflict |
| Timestamp at midnight UTC | ISO 8601 format handles correctly |
| Unicode characters in title | Accepted and stored correctly |
| Whitespace-only title | Rejected (effectively empty after trim) |
| Special characters in description | Accepted and stored correctly |

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each task MUST have a unique positive integer ID that auto-increments
- **FR-002**: Task ID MUST never be reused (even after deletion in Phase I)
- **FR-003**: Task title MUST be validated to be 1-200 characters (non-empty)
- **FR-004**: Task description MUST be validated to be 0-1000 characters
- **FR-005**: Task description MUST default to empty string if not provided
- **FR-006**: Task completed status MUST default to False
- **FR-007**: Task created_at MUST be set to UTC timestamp on creation
- **FR-008**: Task updated_at MUST be set to UTC timestamp on creation and every update
- **FR-009**: All timestamps MUST be in ISO 8601 format with UTC timezone
- **FR-010**: Task lookup by ID MUST be O(1) time complexity
- **FR-011**: Task storage MUST use Python dict with ID as key for Phase I
- **FR-012**: ID counter MUST be maintained separately from task storage

### Data Model

**Task Entity**:

| Field | Type | Required | Default | Validation | Description |
|-------|------|----------|---------|------------|-------------|
| id | int | Yes (auto) | Auto-increment | Positive integer | Unique identifier |
| title | str | Yes | - | 1-200 chars | Task title/summary |
| description | str | No | "" | 0-1000 chars | Detailed information |
| completed | bool | Yes | False | True/False | Completion status |
| created_at | datetime | Yes (auto) | Current UTC | ISO 8601 | Creation timestamp |
| updated_at | datetime | Yes (auto) | Current UTC | ISO 8601 | Last modification |

### Business Rules

**ALWAYS:**
- Generate IDs sequentially starting from 1
- Store timestamps in UTC timezone
- Validate all input before storage
- Update updated_at on every modification

**NEVER:**
- Allow duplicate IDs
- Reuse IDs of deleted tasks
- Store timestamps in local timezone
- Accept empty or whitespace-only titles

### Storage Structure (Phase I)

```
TaskStorage:
  - tasks: Dict[int, Task]  # {id: task_object}
  - next_id: int            # Counter for next ID (starts at 1)
```

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of created tasks have valid unique IDs
- **SC-002**: Task lookup by ID completes instantly (O(1) complexity)
- **SC-003**: All timestamps are in valid ISO 8601 UTC format
- **SC-004**: 100% of invalid data is rejected before storage
- **SC-005**: All task fields can be correctly serialized for display
- **SC-006**: Data model supports all CRUD operations defined in 002-task-crud spec

## Out of Scope

The following are explicitly excluded from Phase I:

- Database persistence (Phase II - PostgreSQL)
- User ownership (user_id foreign key - Phase II)
- Database indexes (Phase II)
- Soft delete fields (deleted_at - simplified for Phase I)
- File-based persistence
- Data encryption
- Audit logging
- Relationships to other entities

## Assumptions

- Single-user, single-session operation (no concurrency issues)
- All data lost when application exits (acceptable for Phase I)
- Python 3.13+ with dataclass support
- UTC timezone available on host system
- No need for data migration within Phase I

## Future Migration Path (Phase II)

When migrating to PostgreSQL with SQLModel:

1. **Convert Task to SQLModel class**
2. **Add user_id foreign key** for multi-user support
3. **Add database indexes** on id, user_id, completed, created_at
4. **Add soft delete** with deleted_at timestamp
5. **Migrate storage** from Dict to database operations
6. **Preserve ID semantics** (auto-increment in database)

## Dependencies

- Python 3.13+ with dataclasses
- datetime module for timestamps
- No external packages required

## Example Data

### Task Object Structure

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

### Storage State Example

```json
{
    "tasks": {
        "1": {"id": 1, "title": "Buy groceries", ...},
        "2": {"id": 2, "title": "Call mom", ...},
        "3": {"id": 3, "title": "Finish report", ...}
    },
    "next_id": 4
}
```
