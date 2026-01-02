# Implementation Plan: Todo Console App (Phase I)

**Branch**: `003-task-schema` | **Date**: 2026-01-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specifications from specs/001-todo-console-app, specs/002-task-crud, specs/003-task-schema

## Summary

Build a command-line todo application in Python 3.13+ with in-memory storage that supports 5 CRUD operations (add, list, update, delete, complete) plus help. The application follows a layered architecture: Models → Storage → Commands → CLI Interface.

## Technical Context

**Language/Version**: Python 3.13+
**Primary Dependencies**: Standard library only (dataclasses, datetime, shlex)
**Storage**: In-memory (Dict[int, Task])
**Testing**: pytest, pytest-cov
**Target Platform**: Linux/macOS/Windows console
**Project Type**: Single project (CLI application)
**Performance Goals**: Instant response (<100ms) for all operations
**Constraints**: Session-based storage (data lost on exit), single-user
**Scale/Scope**: ~300 lines of code, 5 source files, ~200 lines of tests

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. User Autonomy | PASS | Full CRUD control, clear feedback on all operations |
| II. Accessibility First | PASS | Help command, descriptive errors with fixes |
| III. Spec-Driven Development | PASS | All code traces to specs/001-003 |
| IV. Progressive Enhancement | PASS | Architecture supports Phase II migration |
| V. Cloud-Native Ready | PASS | Stateless design, injectable storage |
| VI. Quality Over Speed | PASS | 80%+ test coverage, explicit error handling |

### Phase I Quality Gates

| Gate | Plan Coverage |
|------|---------------|
| All CRUD operations via CLI | 6 commands defined |
| Help command documents all | HelpCommand with per-command detail |
| Error messages user-friendly | Error format: problem + fix |
| 80%+ test coverage | pytest-cov configured |
| Type hints pass mypy strict | All functions typed |
| Code formatted with ruff | Dev dependency |
| README documents usage | quickstart.md created |

## Project Structure

### Documentation (this feature)

```text
specs/003-task-schema/
├── plan.md              # This file
├── research.md          # Technical decisions
├── data-model.md        # Entity definitions
├── quickstart.md        # Usage guide
├── contracts/           # CLI interface contract
│   └── cli-interface.md
└── tasks.md             # (Created by /sp.tasks)
```

### Source Code (repository root)

```text
src/
├── __init__.py          # Package marker
├── main.py              # Entry point, CLI loop
├── models.py            # Task dataclass, Result dataclass
├── storage.py           # TaskStorage class
├── commands.py          # Command handlers
└── utils.py             # Validation, formatting helpers

tests/
├── __init__.py
├── test_models.py       # Task, Result unit tests
├── test_storage.py      # Storage operation tests
├── test_commands.py     # Command handler tests
└── test_integration.py  # End-to-end CLI tests
```

**Structure Decision**: Single project with flat `src/` layout chosen for Phase I simplicity. Easy navigation, clear module boundaries, straightforward test organization.

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                           (main.py)                             │
│  - REPL loop: read input → parse → execute → display result    │
│  - Handle exit, keyboard interrupt                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Command Layer                             │
│                        (commands.py)                            │
│  - AddCommand, ListCommand, UpdateCommand, DeleteCommand        │
│  - CompleteCommand, HelpCommand                                 │
│  - Input validation, business logic, response formatting        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Storage Layer                             │
│                        (storage.py)                             │
│  - TaskStorage: add, get, list, update, delete, toggle_complete │
│  - ID generation, timestamp management                          │
│  - Data integrity                                               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                               │
│                        (models.py)                              │
│  - Task dataclass: id, title, description, completed, timestamps│
│  - Result dataclass: success, message, data                     │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Input: "add 'Buy groceries' 'Milk, eggs'"
     │
     ▼
┌─────────────┐
│  main.py    │  Parse with shlex.split()
│  REPL Loop  │  Route to AddCommand
└─────────────┘
     │
     ▼
┌─────────────┐
│ commands.py │  Validate title/description
│ AddCommand  │  Call storage.add()
└─────────────┘
     │
     ▼
┌─────────────┐
│ storage.py  │  Generate ID, timestamps
│ TaskStorage │  Create Task, store in dict
└─────────────┘
     │
     ▼
┌─────────────┐
│  models.py  │  Task(id=1, title="Buy groceries", ...)
│    Task     │
└─────────────┘
     │
     ▼
Result(success=True, message="Task 1 created successfully", data=task)
     │
     ▼
Output: "Task 1 created successfully"
```

## Component Breakdown

### 1. Task Model (models.py)

**Responsibility**: Define data structures

```python
@dataclass
class Task:
    id: int
    title: str
    description: str
    completed: bool
    created_at: datetime
    updated_at: datetime

@dataclass
class Result:
    success: bool
    message: str
    data: Any = None
```

**Key Methods**:
- `Task.__post_init__()`: Validate on creation
- `Task.to_display_row()`: Format for list view
- `Task.to_detail()`: Format for detail view

---

### 2. Storage Layer (storage.py)

**Responsibility**: Manage task persistence

```python
class TaskStorage:
    def __init__(self):
        self._tasks: dict[int, Task] = {}
        self._next_id: int = 1

    def add(self, title: str, description: str = "") -> Task
    def get(self, task_id: int) -> Task | None
    def list_all(self, status: str | None = None) -> list[Task]
    def update(self, task_id: int, title: str, description: str) -> Result
    def delete(self, task_id: int) -> Result
    def toggle_complete(self, task_id: int) -> Result
    def count(self) -> tuple[int, int, int]  # (total, pending, completed)
```

**Invariants**:
- IDs never reused
- All timestamps UTC
- `updated_at` always current on modification

---

### 3. Command Handlers (commands.py)

**Responsibility**: Parse arguments, validate, execute operations

| Command | Input | Validation | Storage Call |
|---------|-------|------------|--------------|
| AddCommand | title, [desc] | title 1-200, desc 0-1000 | storage.add() |
| ListCommand | [status] | all/pending/completed | storage.list_all() |
| UpdateCommand | id, title, [desc] | id exists, title valid | storage.update() |
| DeleteCommand | id | id exists, confirm | storage.delete() |
| CompleteCommand | id | id exists | storage.toggle_complete() |
| HelpCommand | [command] | valid command name | - |

**Error Format**: All errors return `Result(success=False, message="Error: {problem}. {fix}")`

---

### 4. CLI Interface (main.py)

**Responsibility**: REPL loop, command routing

```python
def main():
    storage = TaskStorage()
    commands = {
        "add": AddCommand(storage),
        "list": ListCommand(storage),
        "update": UpdateCommand(storage),
        "delete": DeleteCommand(storage),
        "complete": CompleteCommand(storage),
        "help": HelpCommand(commands),
    }

    print("Todo Console App - Type 'help' for commands")
    while True:
        try:
            user_input = input("> ").strip()
            if not user_input:
                continue
            if user_input == "exit":
                print("Goodbye!")
                break

            tokens = shlex.split(user_input)
            cmd_name, *args = tokens

            if cmd_name in commands:
                result = commands[cmd_name].execute(*args)
                print(result.message)
            else:
                print(f"Unknown command: '{cmd_name}'. Type 'help' for available commands")

        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"Error: An unexpected error occurred. Please try again.")
```

---

### 5. Utilities (utils.py)

**Responsibility**: Shared validation and formatting

```python
def validate_title(title: str) -> Result
def validate_description(description: str) -> Result
def validate_id(id_str: str) -> Result
def format_timestamp(dt: datetime) -> str
def truncate(text: str, max_len: int = 30) -> str
```

## Implementation Sequence

### Phase 1: Foundation (models.py, utils.py)

1. Create `src/__init__.py`
2. Implement `Task` dataclass with all fields
3. Implement `Result` dataclass
4. Implement validation functions in `utils.py`
5. Write unit tests for models and validation

### Phase 2: Storage Layer (storage.py)

1. Implement `TaskStorage` class
2. Implement `add()` method with ID generation
3. Implement `get()` method
4. Implement `list_all()` with optional filter
5. Implement `update()` method
6. Implement `delete()` method
7. Implement `toggle_complete()` method
8. Write unit tests for all storage operations

### Phase 3: Core Commands (commands.py - Part 1)

1. Implement base `Command` protocol/ABC
2. Implement `AddCommand`
3. Implement `ListCommand`
4. Write tests for add and list commands

### Phase 4: CLI Interface (main.py)

1. Implement REPL loop
2. Implement command routing
3. Handle exit and keyboard interrupt
4. Integration test: add → list flow

### Phase 5: Remaining Commands (commands.py - Part 2)

1. Implement `UpdateCommand`
2. Implement `DeleteCommand` with confirmation
3. Implement `CompleteCommand`
4. Implement `HelpCommand`
5. Write tests for all commands

### Phase 6: Polish

1. Verify all error messages follow format
2. Run mypy strict, fix any issues
3. Run ruff, format code
4. Verify 80%+ test coverage
5. Update README with quickstart

## Testing Strategy

### Unit Tests

| Test File | Coverage |
|-----------|----------|
| test_models.py | Task creation, validation, serialization |
| test_storage.py | All storage operations, edge cases |
| test_commands.py | Each command with valid/invalid input |

### Integration Tests

| Test | Scenario |
|------|----------|
| test_add_list_flow | Add task → List shows it |
| test_complete_toggle | Add → Complete → List shows [x] → Complete → List shows [ ] |
| test_update_flow | Add → Update → List shows new title |
| test_delete_flow | Add → Delete with confirm → List empty |
| test_error_recovery | Invalid command → Valid command works |

### Edge Cases

| Test | Input | Expected |
|------|-------|----------|
| Empty title | `add ""` | Error message |
| Title too long | `add "{201 chars}"` | Error message |
| Invalid ID | `complete abc` | Error message |
| Non-existent ID | `delete 999` | Error message |
| Empty list | `list` | Friendly message |
| Unknown command | `foo` | Error with help hint |

## Success Criteria Mapping

| Spec Criteria | Implementation |
|---------------|----------------|
| SC-001: Add task <3s | Direct dict insert, no I/O |
| SC-002: List with single command | `list` command |
| SC-003: Filter by status | `list pending`, `list completed` |
| SC-004: Update <3s | Direct dict update |
| SC-005: Delete <5s with confirm | Prompt + dict delete |
| SC-006: Toggle <2s | Direct dict update |
| SC-007: Error includes fix | All errors: "Error: X. Y" |
| SC-008: Immediate feedback | Result printed after each command |
| SC-009: Stable after error | Try/except in REPL |
| SC-010: Help documents all | HelpCommand lists 6 operations |

## Dependencies

### Runtime (pyproject.toml)

```toml
[project]
requires-python = ">=3.13"
dependencies = []  # Standard library only
```

### Development

```toml
[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=4.0",
    "mypy>=1.8",
    "ruff>=0.1",
]
```

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Users expect persistence | Clear "session-only" message on start |
| Command parsing edge cases | Use shlex.split(), comprehensive tests |
| Unicode in titles | Python 3 handles natively, test explicitly |
| Large task lists | Pagination out of scope, warn in docs |

## Complexity Tracking

> No constitution violations detected. All patterns align with Phase I requirements.

## Next Steps

After this plan is approved:
1. Run `/sp.tasks` to generate atomic work items
2. Run `/sp.implement` to execute tasks
3. Verify all quality gates pass
4. Create PR for Phase I completion
