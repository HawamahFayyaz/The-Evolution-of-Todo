# Quickstart: Todo Console App (Phase I)

**Feature Branch**: `003-task-schema`
**Date**: 2026-01-01

## Prerequisites

- Python 3.13+
- UV package manager

## Installation

```bash
# Clone repository
git clone <repo-url>
cd hackathon-todo

# Install dependencies with UV
uv sync

# Run the application
uv run python -m src.main
```

## Usage

### Basic Commands

```bash
# Add a task
> add "Buy groceries"
Task 1 created successfully

# Add with description
> add "Buy groceries" "Milk, eggs, bread from store"
Task 2 created successfully

# List all tasks
> list
ID  Status  Title                                     Description
1   [ ]     Buy groceries
2   [ ]     Buy groceries                             Milk, eggs, bread from...

2 tasks total, 2 pending, 0 completed

# Mark complete
> complete 1
Task 1 marked as complete

# List pending only
> list pending
ID  Status  Title                                     Description
2   [ ]     Buy groceries                             Milk, eggs, bread from...

1 task, 1 pending, 0 completed

# Update a task
> update 2 "Go shopping" "Weekly groceries"
Task 2 updated successfully

# Delete a task
> delete 1
Delete task 1: 'Buy groceries'? (y/n): y
Task 1 deleted successfully

# Get help
> help
Available commands:
  add <title> [description]  - Create a new task
  list [status]              - Show tasks (all/pending/completed)
  update <id> <title> [desc] - Modify a task
  delete <id>                - Remove a task (with confirmation)
  complete <id>              - Toggle completion status
  help [command]             - Show help information
  exit                       - Exit the application

> help add
add <title> [description]

Create a new task with the given title and optional description.

Examples:
  add "Buy groceries"
  add "Buy groceries" "Milk, eggs, bread"

# Exit
> exit
Goodbye!
```

## Development

### Run Tests

```bash
# Run all tests
uv run pytest

# Run with coverage
uv run pytest --cov=src --cov-report=term-missing

# Run specific test file
uv run pytest tests/test_storage.py
```

### Type Checking

```bash
uv run mypy src --strict
```

### Code Formatting

```bash
uv run ruff check src tests
uv run ruff format src tests
```

## Project Structure

```
hackathon-todo/
├── src/
│   ├── __init__.py      # Package marker
│   ├── main.py          # Entry point, CLI loop
│   ├── models.py        # Task dataclass
│   ├── storage.py       # TaskStorage class
│   ├── commands.py      # Command handlers
│   └── utils.py         # Validation, formatting
├── tests/
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_storage.py
│   ├── test_commands.py
│   └── test_integration.py
├── specs/               # Specifications
├── pyproject.toml       # Project config
└── README.md
```

## Troubleshooting

### "Command not found"

Make sure you're in the correct directory and UV is installed:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### "Invalid task ID"

Task IDs must be positive integers. Use `list` to see available task IDs.

### "Title is required"

Titles cannot be empty. Provide a non-empty string in quotes:
```bash
add "My task title"
```

## Next Steps

After Phase I is complete:
- Phase II adds web interface and database persistence
- Phase III adds AI chatbot integration
- Phase IV adds Kubernetes deployment
- Phase V adds cloud-native features
