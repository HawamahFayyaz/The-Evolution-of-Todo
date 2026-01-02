# Research: Todo Console App (Phase I)

**Feature Branch**: `003-task-schema`
**Date**: 2026-01-01
**Status**: Complete

## Overview

This document consolidates research findings for Phase I implementation decisions. All technical context items have been resolved.

---

## Decision 1: Python Dataclass Implementation

**Context**: Need to define Task model with validation, defaults, and serialization.

**Decision**: Use Python `@dataclass` with `field()` defaults and custom validation methods.

**Rationale**:
- Native Python 3.13+ feature, no external dependencies
- Constitution mandates dataclasses for Phase I
- Built-in `__post_init__` for validation
- Easy migration path to Pydantic/SQLModel in Phase II

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Named tuples | Immutable, no validation support |
| Plain classes | More boilerplate, less readable |
| Pydantic | External dependency, overkill for Phase I |
| TypedDict | No validation, no methods |

---

## Decision 2: In-Memory Storage Pattern

**Context**: Need efficient task storage with O(1) lookup by ID.

**Decision**: Use `Dict[int, Task]` with separate ID counter.

**Rationale**:
- O(1) lookup by ID (dictionary access)
- O(n) listing (iterate values)
- Simple ID generation with counter
- Constitution requires in-memory for Phase I

**Storage Structure**:
```python
class TaskStorage:
    tasks: dict[int, Task]  # {id: Task}
    _next_id: int           # Counter starting at 1
```

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| List with index | ID != index after deletions |
| SQLite in-memory | External complexity, not needed |
| JSON file | Constitution specifies in-memory only |

---

## Decision 3: Command Parsing Strategy

**Context**: Need to parse user input into commands and arguments.

**Decision**: Use `shlex.split()` for shell-like argument parsing.

**Rationale**:
- Handles quoted strings: `add "Buy groceries" "Milk, eggs"`
- Standard library, no dependencies
- Familiar shell semantics for users

**Parsing Flow**:
```
User Input: add "Buy groceries" "Milk, eggs"
     ↓ shlex.split()
Tokens: ['add', 'Buy groceries', 'Milk, eggs']
     ↓ route to handler
AddCommand.execute('Buy groceries', 'Milk, eggs')
```

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| argparse | Too complex for simple REPL |
| click/typer | External dependencies |
| Manual split | Doesn't handle quoted strings |

---

## Decision 4: Timestamp Handling

**Context**: Need UTC timestamps for created_at and updated_at fields.

**Decision**: Use `datetime.now(timezone.utc)` with ISO 8601 string formatting.

**Rationale**:
- Constitution mandates UTC timestamps
- ISO 8601 is human-readable and sortable
- Standard library only

**Format**: `2026-01-01T10:30:00Z`

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Unix timestamps | Less readable for debugging |
| Local timezone | Constitution forbids |
| Third-party (arrow) | Unnecessary dependency |

---

## Decision 5: Error Handling Strategy

**Context**: Need consistent error handling that never crashes.

**Decision**: Return-based error handling with typed result objects.

**Rationale**:
- Constitution requires explicit error handling
- No exceptions reaching user interface
- Consistent error message format

**Pattern**:
```python
@dataclass
class Result:
    success: bool
    message: str
    data: Any = None
```

**Alternatives Considered**:
| Alternative | Rejected Because |
|-------------|------------------|
| Exceptions only | Risk of unhandled crashes |
| Error codes | Less readable than objects |
| Either monad | Overkill for Phase I |

---

## Decision 6: Project Structure

**Context**: Need organized codebase with separation of concerns.

**Decision**: Flat `src/` structure with domain-separated modules.

**Rationale**:
- Simple for Phase I scope
- Easy to navigate
- Clear separation: models → storage → commands → CLI

**Structure**:
```
src/
├── __init__.py      # Package marker
├── main.py          # Entry point, CLI loop
├── models.py        # Task dataclass
├── storage.py       # TaskStorage class
├── commands.py      # Command handlers
└── utils.py         # Validation, formatting

tests/
├── __init__.py
├── test_models.py
├── test_storage.py
├── test_commands.py
└── test_integration.py
```

---

## Decision 7: Testing Framework

**Context**: Constitution requires 80%+ test coverage with pytest.

**Decision**: pytest with pytest-cov for coverage.

**Rationale**:
- Constitution mandates pytest
- pytest-cov for coverage reporting
- Simple, no complex test infrastructure needed

**Test Categories**:
1. **Unit tests**: Individual functions/methods
2. **Integration tests**: Command → Storage → Result flow
3. **Edge case tests**: Validation boundaries

---

## Summary of Technical Choices

| Area | Decision | Dependency |
|------|----------|------------|
| Language | Python 3.13+ | Built-in |
| Data Model | @dataclass | Built-in |
| Storage | Dict[int, Task] | Built-in |
| Parsing | shlex.split() | Built-in |
| Timestamps | datetime + timezone | Built-in |
| Errors | Result dataclass | Built-in |
| Testing | pytest + pytest-cov | Dev dependency |

**Total External Dependencies**: 0 (runtime), 2 (dev: pytest, pytest-cov)
