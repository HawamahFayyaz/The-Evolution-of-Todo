# Tasks: Todo Console App (Phase I)

**Input**: Design documents from `/specs/003-task-schema/`
**Prerequisites**: plan.md, spec.md (002-task-crud), data-model.md, contracts/, research.md, quickstart.md

**Tests**: Tests are included as per constitution requirement (80%+ coverage).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- Paths follow plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project structure: `src/`, `tests/`, `src/__init__.py`, `tests/__init__.py`
- [X] T002 Initialize Python project with `pyproject.toml` (Python 3.13+, UV package manager)
- [X] T003 [P] Configure dev dependencies: pytest, pytest-cov, mypy, ruff in `pyproject.toml`
- [X] T004 [P] Create `.gitignore` for Python project

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Create Result dataclass in `src/models.py` (success, message, data fields)
- [X] T006 Create Task dataclass in `src/models.py` (id, title, description, completed, created_at, updated_at)
- [X] T007 Implement validation functions in `src/utils.py`: validate_title(), validate_description(), validate_id()
- [X] T008 [P] Implement formatting functions in `src/utils.py`: format_timestamp(), truncate()
- [X] T009 Create TaskStorage class skeleton in `src/storage.py` with _tasks dict and _next_id counter
- [X] T010 Implement `storage.add()` method with ID generation and timestamp handling
- [X] T011 Implement `storage.get()` method for O(1) lookup by ID
- [X] T012 Implement `storage.count()` method returning (total, pending, completed) tuple
- [X] T013 [P] Write unit tests for Task and Result dataclasses in `tests/test_models.py`
- [X] T014 [P] Write unit tests for validation functions in `tests/test_utils.py`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Add Task (Priority: P1) MVP

**Goal**: Users can create new tasks with title and optional description

**Independent Test**: Run `add "Buy groceries"` and verify confirmation with task ID

### Tests for User Story 1

- [X] T015 [P] [US1] Write unit tests for storage.add() in `tests/test_storage.py`
- [X] T016 [P] [US1] Write unit tests for AddCommand in `tests/test_commands.py`

### Implementation for User Story 1

- [X] T017 [US1] Create Command base class/protocol in `src/commands.py` with execute() and help() methods
- [X] T018 [US1] Implement AddCommand in `src/commands.py` with title/description validation
- [X] T019 [US1] Add AddCommand error messages following format: "Error: {problem}. {fix}"

**Checkpoint**: Add Task works independently - can demo creating tasks

---

## Phase 4: User Story 2 - View Tasks (Priority: P1)

**Goal**: Users can list all tasks with filtering by status

**Independent Test**: Add tasks, run `list` and verify all tasks shown with status indicators

### Tests for User Story 2

- [X] T020 [P] [US2] Write unit tests for storage.list_all() in `tests/test_storage.py`
- [X] T021 [P] [US2] Write unit tests for ListCommand in `tests/test_commands.py`

### Implementation for User Story 2

- [X] T022 [US2] Implement `storage.list_all()` method with optional status filter in `src/storage.py`
- [X] T023 [US2] Implement ListCommand in `src/commands.py` with status filtering (all/pending/completed)
- [X] T024 [US2] Add task display formatting: ID, status checkbox, title, truncated description
- [X] T025 [US2] Add summary line: "X tasks total, Y pending, Z completed"
- [X] T026 [US2] Handle empty list case with friendly message

**Checkpoint**: Add + List work together - can create and view tasks

---

## Phase 5: User Story 3 - Update Task (Priority: P2)

**Goal**: Users can modify task title and/or description

**Independent Test**: Add task, run `update 1 "New title"`, verify change in list

### Tests for User Story 3

- [X] T027 [P] [US3] Write unit tests for storage.update() in `tests/test_storage.py`
- [X] T028 [P] [US3] Write unit tests for UpdateCommand in `tests/test_commands.py`

### Implementation for User Story 3

- [X] T029 [US3] Implement `storage.update()` method in `src/storage.py` with updated_at handling
- [X] T030 [US3] Implement UpdateCommand in `src/commands.py` with ID and title validation
- [X] T031 [US3] Add UpdateCommand error handling for non-existent and invalid IDs

**Checkpoint**: Add + List + Update work - can create, view, and modify tasks

---

## Phase 6: User Story 4 - Delete Task (Priority: P2)

**Goal**: Users can remove tasks with confirmation

**Independent Test**: Add task, run `delete 1`, confirm with "y", verify removed from list

### Tests for User Story 4

- [X] T032 [P] [US4] Write unit tests for storage.delete() in `tests/test_storage.py`
- [X] T033 [P] [US4] Write unit tests for DeleteCommand in `tests/test_commands.py`

### Implementation for User Story 4

- [X] T034 [US4] Implement `storage.delete()` method in `src/storage.py`
- [X] T035 [US4] Implement DeleteCommand in `src/commands.py` with confirmation prompt
- [X] T036 [US4] Handle y/yes confirms, n/no cancels in DeleteCommand
- [X] T037 [US4] Add DeleteCommand error handling for non-existent IDs

**Checkpoint**: Full CRUD minus toggle - can create, read, update, delete tasks

---

## Phase 7: User Story 5 - Mark Complete (Priority: P2)

**Goal**: Users can toggle task completion status

**Independent Test**: Add task, run `complete 1`, verify [x] in list, run again, verify [ ]

### Tests for User Story 5

- [X] T038 [P] [US5] Write unit tests for storage.toggle_complete() in `tests/test_storage.py`
- [X] T039 [P] [US5] Write unit tests for CompleteCommand in `tests/test_commands.py`

### Implementation for User Story 5

- [X] T040 [US5] Implement `storage.toggle_complete()` method in `src/storage.py`
- [X] T041 [US5] Implement CompleteCommand in `src/commands.py`
- [X] T042 [US5] Add toggle message: "marked as complete" or "marked as pending"

**Checkpoint**: All CRUD operations work - full task management functionality

---

## Phase 8: User Story 6 - Help Command (Priority: P3)

**Goal**: Users can view available commands and their usage

**Independent Test**: Run `help` and verify all 6 commands listed, run `help add` for details

### Tests for User Story 6

- [X] T043 [P] [US6] Write unit tests for HelpCommand in `tests/test_commands.py`

### Implementation for User Story 6

- [X] T044 [US6] Implement HelpCommand in `src/commands.py` with command registry
- [X] T045 [US6] Add general help listing all commands with descriptions
- [X] T046 [US6] Add per-command help with usage examples

**Checkpoint**: Help system complete - users can discover all functionality

---

## Phase 9: CLI Interface

**Purpose**: Main REPL loop that ties all commands together

### Tests for CLI

- [X] T047 [P] Write integration tests in `tests/test_integration.py`: add→list flow
- [X] T048 [P] Write integration tests in `tests/test_integration.py`: complete toggle flow
- [X] T049 [P] Write integration tests in `tests/test_integration.py`: error recovery

### Implementation

- [X] T050 Create main() function in `src/main.py` with REPL loop
- [X] T051 Implement command parsing with shlex.split() in `src/main.py`
- [X] T052 Implement command routing to handlers in `src/main.py`
- [X] T053 Add exit command handling in `src/main.py`
- [X] T054 Add keyboard interrupt (Ctrl+C) handling in `src/main.py`
- [X] T055 Add unknown command error with help suggestion in `src/main.py`
- [X] T056 Add welcome message on startup in `src/main.py`

**Checkpoint**: Application fully functional - all commands work via REPL

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Quality assurance and documentation

- [X] T057 Run mypy strict on `src/` and fix any type errors
- [X] T058 Run ruff check and format on `src/` and `tests/`
- [X] T059 Verify 80%+ test coverage with pytest-cov
- [X] T060 Create README.md with installation and usage instructions
- [X] T061 Validate application against quickstart.md scenarios
- [X] T062 Final integration test: 20+ operations session

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3-8)**: All depend on Foundational phase completion
  - US1 (Add) and US2 (List) can proceed in parallel after Foundational
  - US3-US6 can proceed after US1+US2 are complete
- **CLI (Phase 9)**: Depends on all user story commands being implemented
- **Polish (Phase 10)**: Depends on CLI being complete

### User Story Dependencies

- **User Story 1 (Add)**: Can start after Foundational - No dependencies
- **User Story 2 (List)**: Can start after Foundational - No dependencies (uses storage.list_all)
- **User Story 3 (Update)**: Needs storage foundation - Can parallel with US1/US2
- **User Story 4 (Delete)**: Needs storage foundation - Can parallel with US1/US2
- **User Story 5 (Complete)**: Needs storage foundation - Can parallel with US1/US2
- **User Story 6 (Help)**: Needs command registry - Best after US1-US5 complete

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Storage methods before commands
- Commands before CLI integration
- Story complete before marking checkpoint done

### Parallel Opportunities

- T003, T004 can run in parallel (Setup)
- T008, T013, T014 can run in parallel (Foundational)
- T015, T016 can run in parallel (US1 tests)
- T020, T021 can run in parallel (US2 tests)
- US1 and US2 can run in parallel after Foundational
- US3, US4, US5 can run in parallel after Foundational
- T047, T048, T049 can run in parallel (Integration tests)

---

## Parallel Example: Foundational Phase

```bash
# Launch these together after T007 completes:
Task: "T008 [P] Implement formatting functions in src/utils.py"
Task: "T013 [P] Write unit tests for Task and Result dataclasses"
Task: "T014 [P] Write unit tests for validation functions"
```

## Parallel Example: User Stories After Foundational

```bash
# After Phase 2 completes, launch US1 and US2 together:
# Developer A works on:
Task: "T015-T019" (User Story 1: Add Task)

# Developer B works on:
Task: "T020-T026" (User Story 2: View Tasks)
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (Add Task)
4. Complete Phase 4: User Story 2 (List Tasks)
5. **STOP and VALIDATE**: Can add and view tasks
6. Demo MVP: Working add + list functionality

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 + US2 → MVP (add and list tasks)
3. Add US3 → Can update tasks
4. Add US4 → Can delete tasks
5. Add US5 → Can complete tasks
6. Add US6 → Help system
7. CLI Integration → Full REPL
8. Polish → Production ready

---

## Task Summary

| Phase | Tasks | Parallel Tasks | User Story |
|-------|-------|----------------|------------|
| Setup | 4 | 2 | - |
| Foundational | 10 | 4 | - |
| US1: Add | 5 | 2 | P1 |
| US2: List | 7 | 2 | P1 |
| US3: Update | 5 | 2 | P2 |
| US4: Delete | 6 | 2 | P2 |
| US5: Complete | 5 | 2 | P2 |
| US6: Help | 4 | 1 | P3 |
| CLI | 10 | 3 | - |
| Polish | 6 | 0 | - |
| **Total** | **62** | **20** | **6 stories** |

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Constitution requires 80%+ test coverage
