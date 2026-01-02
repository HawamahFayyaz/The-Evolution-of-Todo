# Feature Specification: Task CRUD Operations

**Feature Branch**: `002-task-crud`
**Feature ID**: FEAT-001
**Created**: 2026-01-01
**Status**: Draft
**Input**: User description: "Task CRUD Operations for Phase I Console App - Add, View, Update, Delete, and Complete tasks"

## Overview

This specification defines the core task management operations for the Phase I console application. These five CRUD operations form the foundation of the todo application and will be the basis for all future enhancements in subsequent phases.

## Constitution Alignment

- **User Autonomy**: Users have complete control over creating, modifying, and removing their tasks
- **Accessibility First**: All commands have clear, descriptive names with helpful error messages
- **Quality Over Speed**: Proper validation and error handling for all inputs

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Task (Priority: P1)

AS A user
I WANT TO create a new task
SO THAT I can track things I need to do

**Why this priority**: Task creation is the foundational operation. No other features have value without the ability to add tasks.

**Independent Test**: Can be tested by running the add command with a title and verifying the task appears in the list. Delivers immediate value by enabling users to capture todos.

**Acceptance Scenarios**:

1. **Given** the application is running, **When** I execute `add "Buy groceries"`, **Then** a new task is created with that title, a unique ID is assigned, and a confirmation message is displayed
2. **Given** the application is running, **When** I execute `add "Buy groceries" "Milk, eggs, bread"`, **Then** a task is created with both title and description
3. **Given** I try to add a task, **When** I provide an empty title, **Then** the system displays an error: "Error: Title is required. Usage: add <title> [description]"
4. **Given** I try to add a task, **When** I provide a title exceeding 200 characters, **Then** the system displays an error: "Error: Title must be 1-200 characters"
5. **Given** I try to add a task, **When** I provide a description exceeding 1000 characters, **Then** the system displays an error: "Error: Description must be 0-1000 characters"

---

### User Story 2 - View Tasks (Priority: P1)

AS A user
I WANT TO see all my tasks
SO THAT I know what needs to be done

**Why this priority**: Viewing tasks is essential to understand current workload and verify other operations work correctly.

**Independent Test**: Can be tested by adding tasks and running the list command. Delivers value by showing users their complete task inventory.

**Acceptance Scenarios**:

1. **Given** I have tasks in the system, **When** I execute `list`, **Then** I see all tasks with ID, Title, Status, Description (truncated if long), and Created Date
2. **Given** I have no tasks, **When** I execute `list`, **Then** I see: "No tasks found. Add your first task with: add <title>"
3. **Given** I have both completed and pending tasks, **When** I execute `list`, **Then** pending tasks show as "[ ]" and completed tasks show as "[x]"
4. **Given** I have 5 pending and 3 completed tasks, **When** I execute `list`, **Then** I see a summary: "8 tasks total, 5 pending, 3 completed"
5. **Given** I execute `list pending`, **When** there are pending tasks, **Then** I see only pending tasks
6. **Given** I execute `list completed`, **When** there are completed tasks, **Then** I see only completed tasks
7. **Given** I have multiple tasks, **When** I list them, **Then** they appear sorted by creation date (newest first)

---

### User Story 3 - Update Task (Priority: P2)

AS A user
I WANT TO modify a task's details
SO THAT I can correct mistakes or add information

**Why this priority**: Updates are important for maintaining accurate task information but depend on tasks existing first.

**Independent Test**: Can be tested by adding a task, updating it, and verifying changes in the list. Delivers value by allowing users to refine their tasks.

**Acceptance Scenarios**:

1. **Given** task ID 1 exists with title "Buy food", **When** I execute `update 1 "Buy groceries"`, **Then** the task title is updated and I see: "Task 1 updated successfully"
2. **Given** task ID 1 exists, **When** I execute `update 1 "Buy groceries" "Milk, eggs"`, **Then** both title and description are updated
3. **Given** I try to update a task, **When** the ID does not exist, **Then** I see: "Error: Task not found. Use 'list' to see available tasks"
4. **Given** I try to update a task, **When** I provide a non-numeric ID, **Then** I see: "Error: Invalid task ID. ID must be a positive number"
5. **Given** I update a task, **When** the operation completes, **Then** the task's original ID remains unchanged

---

### User Story 4 - Delete Task (Priority: P2)

AS A user
I WANT TO remove a task
SO THAT I can clean up my list

**Why this priority**: Deletion is important for list hygiene but used less frequently than viewing or updating.

**Independent Test**: Can be tested by adding a task, deleting it, and verifying it no longer appears. Delivers value by keeping the task list clean.

**Acceptance Scenarios**:

1. **Given** task ID 1 exists, **When** I execute `delete 1` and confirm with "y", **Then** the task is removed and I see: "Task 1 deleted successfully"
2. **Given** task ID 1 exists, **When** I execute `delete 1` and respond with "n", **Then** the task remains and I see: "Deletion cancelled"
3. **Given** I try to delete a task, **When** the ID does not exist, **Then** I see: "Error: Task not found. Use 'list' to see available tasks"
4. **Given** I try to delete a task, **When** I provide a non-numeric ID, **Then** I see: "Error: Invalid task ID. ID must be a positive number"
5. **Given** I execute `delete 1`, **When** prompted for confirmation, **Then** I see: "Delete task 1: '[task title]'? (y/n):"

---

### User Story 5 - Mark Complete (Priority: P2)

AS A user
I WANT TO mark a task as complete
SO THAT I can track my progress

**Why this priority**: Completion tracking is core to task management workflow, enabling users to see progress.

**Independent Test**: Can be tested by adding a task, marking it complete, and verifying status change in list. Delivers satisfaction of tracking progress.

**Acceptance Scenarios**:

1. **Given** task ID 1 is pending, **When** I execute `complete 1`, **Then** the task is marked complete and I see: "Task 1 marked as complete"
2. **Given** task ID 1 is already complete, **When** I execute `complete 1`, **Then** the task is marked pending and I see: "Task 1 marked as pending"
3. **Given** I try to complete a task, **When** the ID does not exist, **Then** I see: "Error: Task not found. Use 'list' to see available tasks"
4. **Given** I try to complete a task, **When** I provide a non-numeric ID, **Then** I see: "Error: Invalid task ID. ID must be a positive number"

---

### User Story 6 - Help Command (Priority: P3)

AS A user
I WANT TO see available commands and their usage
SO THAT I can learn how to use the application

**Why this priority**: Help is essential for discoverability but users can often figure out basic commands without it.

**Independent Test**: Can be tested by running help command and verifying all commands are documented. Delivers value by enabling self-service learning.

**Acceptance Scenarios**:

1. **Given** the application is running, **When** I execute `help`, **Then** I see a list of all commands with brief descriptions
2. **Given** I want help on add command, **When** I execute `help add`, **Then** I see detailed usage: "add <title> [description] - Create a new task"
3. **Given** I enter an unknown command, **When** the command is not recognized, **Then** I see: "Unknown command: '[command]'. Type 'help' for available commands"

---

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Empty title provided | Show error: "Title is required" with usage hint |
| Title exceeds 200 characters | Show error: "Title must be 1-200 characters" |
| Description exceeds 1000 characters | Show error: "Description must be 0-1000 characters" |
| Task ID doesn't exist | Show error: "Task not found" with suggestion to list tasks |
| Negative task ID | Show error: "Invalid task ID. ID must be a positive number" |
| Non-numeric task ID | Show error: "Invalid task ID. ID must be a positive number" |
| No tasks exist (empty list) | Show friendly message with hint to add first task |
| Unknown command entered | Show error with suggestion to use help |
| Rapid sequential operations | System handles correctly (in-memory is sequential) |

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to add tasks with a title (required) and description (optional)
- **FR-002**: System MUST validate title length (1-200 characters)
- **FR-003**: System MUST validate description length (0-1000 characters)
- **FR-004**: System MUST assign a unique sequential ID to each task upon creation
- **FR-005**: System MUST store creation timestamp (UTC) for each task
- **FR-006**: System MUST set new tasks to "pending" status by default
- **FR-007**: System MUST allow users to list all tasks with filtering by status (all/pending/completed)
- **FR-008**: System MUST display tasks sorted by creation date (newest first)
- **FR-009**: System MUST show task summary count (total, pending, completed) in list view
- **FR-010**: System MUST allow users to update task title and/or description by ID
- **FR-011**: System MUST preserve task ID when updating
- **FR-012**: System MUST allow users to delete tasks by ID with confirmation prompt
- **FR-013**: System MUST accept y/yes to confirm deletion and n/no to cancel
- **FR-014**: System MUST allow users to toggle task completion status by ID
- **FR-015**: System MUST store completion timestamp (UTC) when task is marked complete
- **FR-016**: System MUST provide a help command showing all available commands
- **FR-017**: System MUST display user-friendly error messages that explain the problem and how to fix it
- **FR-018**: System MUST remain stable after any error (no crashes, user can retry)

### Business Rules

**ALWAYS:**
- Validate all user input before processing
- Provide confirmation messages for successful operations
- Include helpful suggestions in error messages
- Maintain data integrity across operations

**NEVER:**
- Show technical stack traces to users
- Allow empty task titles
- Delete tasks without confirmation
- Crash on invalid input

### Key Entities

- **Task**: Represents a todo item with:
  - **ID**: Unique sequential identifier (auto-generated)
  - **Title**: User-provided description (1-200 characters, required)
  - **Description**: Additional details (0-1000 characters, optional)
  - **Status**: Current state (pending or completed)
  - **Created At**: Timestamp when task was added (UTC)
  - **Completed At**: Timestamp when marked complete (UTC, null if pending)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can add a new task in under 3 seconds from command entry to confirmation
- **SC-002**: Users can view their complete task list with a single command
- **SC-003**: Users can filter tasks by status (pending/completed) with a single command
- **SC-004**: Users can update any task field in under 3 seconds from command entry to confirmation
- **SC-005**: Users can delete a task in under 5 seconds including confirmation prompt
- **SC-006**: Users can toggle task completion status in under 2 seconds
- **SC-007**: All error messages include both the problem and a suggested fix
- **SC-008**: 100% of commands provide immediate visual feedback upon completion
- **SC-009**: Application remains responsive after any error (users can continue working)
- **SC-010**: Help command documents all 6 available operations

## Out of Scope

The following are explicitly excluded from this feature:

- Task priorities or categories
- Due dates or reminders
- Task tags or labels
- Subtasks or checklists
- Task search functionality
- Data persistence (session-only in Phase I)
- Bulk operations (delete multiple, complete multiple)
- Undo/redo functionality
- Data export/import
- Multi-user support

## Assumptions

- Single user operating the console application
- Tasks are session-based (data lost when application exits - acceptable for Phase I)
- Users are comfortable with command-line interfaces
- English language interface only
- Terminal supports standard text output
- Sequential task IDs are acceptable (no UUID requirement for Phase I)

## Dependencies

- Python 3.13+ runtime environment
- UV package manager
- Standard library only (no external packages for core functionality)

## Console Interface

Commands available to users:

| Command | Description | Example |
|---------|-------------|---------|
| `add <title> [description]` | Create a new task | `add "Buy groceries" "Milk, eggs"` |
| `list [status]` | Show tasks (all/pending/completed) | `list pending` |
| `update <id> <title> [description]` | Modify a task | `update 1 "New title"` |
| `delete <id>` | Remove a task (with confirmation) | `delete 1` |
| `complete <id>` | Toggle completion status | `complete 1` |
| `help [command]` | Show help information | `help add` |
