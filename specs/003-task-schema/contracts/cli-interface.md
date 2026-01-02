# CLI Interface Contract

**Version**: 1.0.0
**Date**: 2026-01-01

## Command Reference

### add

**Syntax**: `add <title> [description]`

**Arguments**:
| Argument | Required | Type | Validation |
|----------|----------|------|------------|
| title | Yes | string | 1-200 chars, non-empty |
| description | No | string | 0-1000 chars |

**Response**:
```
# Success
Task {id} created successfully

# Errors
Error: Title is required. Usage: add <title> [description]
Error: Title must be 1-200 characters
Error: Description must be 0-1000 characters
```

---

### list

**Syntax**: `list [status]`

**Arguments**:
| Argument | Required | Type | Validation |
|----------|----------|------|------------|
| status | No | string | "all" \| "pending" \| "completed" |

**Response**:
```
# With tasks
ID  Status  Title                                     Description
1   [x]     Buy groceries                             Milk, eggs, bread...
2   [ ]     Call mom

2 tasks total, 1 pending, 1 completed

# Empty
No tasks found. Add your first task with: add <title>
```

---

### update

**Syntax**: `update <id> <title> [description]`

**Arguments**:
| Argument | Required | Type | Validation |
|----------|----------|------|------------|
| id | Yes | int | Positive integer, must exist |
| title | Yes | string | 1-200 chars, non-empty |
| description | No | string | 0-1000 chars |

**Response**:
```
# Success
Task {id} updated successfully

# Errors
Error: Task not found. Use 'list' to see available tasks
Error: Invalid task ID. ID must be a positive number
Error: Title must be 1-200 characters
```

---

### delete

**Syntax**: `delete <id>`

**Arguments**:
| Argument | Required | Type | Validation |
|----------|----------|------|------------|
| id | Yes | int | Positive integer, must exist |

**Response**:
```
# Confirmation prompt
Delete task {id}: '{title}'? (y/n):

# Confirmed
Task {id} deleted successfully

# Cancelled
Deletion cancelled

# Errors
Error: Task not found. Use 'list' to see available tasks
Error: Invalid task ID. ID must be a positive number
```

---

### complete

**Syntax**: `complete <id>`

**Arguments**:
| Argument | Required | Type | Validation |
|----------|----------|------|------------|
| id | Yes | int | Positive integer, must exist |

**Response**:
```
# Toggle to complete
Task {id} marked as complete

# Toggle to pending
Task {id} marked as pending

# Errors
Error: Task not found. Use 'list' to see available tasks
Error: Invalid task ID. ID must be a positive number
```

---

### help

**Syntax**: `help [command]`

**Arguments**:
| Argument | Required | Type | Validation |
|----------|----------|------|------------|
| command | No | string | Valid command name |

**Response**:
```
# General help
Available commands:
  add <title> [description]  - Create a new task
  list [status]              - Show tasks (all/pending/completed)
  update <id> <title> [desc] - Modify a task
  delete <id>                - Remove a task (with confirmation)
  complete <id>              - Toggle completion status
  help [command]             - Show help information
  exit                       - Exit the application

# Command-specific help
{command} {syntax}

{description}

Examples:
  {example1}
  {example2}
```

---

### exit

**Syntax**: `exit`

**Response**:
```
Goodbye!
```

---

## Error Message Format

All errors follow this pattern:
```
Error: {what went wrong}. {how to fix it}
```

Examples:
- `Error: Title is required. Usage: add <title> [description]`
- `Error: Task not found. Use 'list' to see available tasks`
- `Error: Invalid task ID. ID must be a positive number`

---

## Unknown Command

**Response**:
```
Unknown command: '{command}'. Type 'help' for available commands
```
