# Todo Console App - Phase I

A command-line todo application built with Python 3.13+ using only the standard library.

## Features

- Add tasks with title and optional description
- List all tasks with status filtering (all/pending/completed)
- Update task title and description
- Delete tasks with confirmation
- Toggle task completion status
- Built-in help system

## Installation

### Prerequisites

- Python 3.13+
- UV package manager (recommended) or pip

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd hackathon-todo

# Install with UV (recommended)
uv sync

# Or create a virtual environment and install
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -e ".[dev]"
```

## Usage

```bash
# Run the application
uv run python -m src.main
# Or if using venv:
python -m src.main
```

### Commands

```
> help
Available commands:
  add <title> [description]  - Create a new task
  list [status]              - Show tasks (all/pending/done)
  update <id> <title> [desc] - Modify a task
  delete <id>                - Remove a task (with confirmation)
  complete <id>              - Toggle completion status
  help [command]             - Show help information
  exit                       - Exit the application
```

### Examples

```bash
# Add a task
> add "Buy groceries"
Task 1 created successfully

# Add a task with description
> add "Buy groceries" "Milk, eggs, bread from store"
Task 2 created successfully

# List all tasks
> list
ID  Status  Title                                     Description
  1 [ ]     Buy groceries
  2 [ ]     Buy groceries                             Milk, eggs, bread...

2 tasks total, 2 pending, 0 completed

# Mark task as complete
> complete 1
Task 1 marked as complete

# List pending tasks only
> list pending

# Update a task
> update 2 "Go shopping" "Weekly groceries"
Task 2 updated successfully

# Delete a task
> delete 1
Delete task 1: 'Buy groceries'? (y/n): y
Task 1 deleted successfully

# Exit
> exit
Goodbye!
```

## Development

### Run Tests

```bash
# All tests
uv run pytest

# With coverage
uv run pytest --cov=src --cov-report=term-missing

# Specific test file
uv run pytest tests/test_storage.py -v
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
│   ├── models.py        # Task, Result dataclasses
│   ├── storage.py       # TaskStorage class
│   ├── commands.py      # Command handlers
│   └── utils.py         # Validation, formatting
├── tests/
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_storage.py
│   ├── test_commands.py
│   └── test_integration.py
├── specs/               # Specifications (SDD)
├── pyproject.toml       # Project config
└── README.md
```

## Notes

- Tasks are stored in memory only (session-based)
- Data is lost when the application exits
- Phase II will add database persistence

## License

MIT
