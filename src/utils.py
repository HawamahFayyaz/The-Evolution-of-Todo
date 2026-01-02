"""Utility functions for validation and formatting.

[From]: specs/003-task-schema/data-model.md, specs/003-task-schema/contracts/
"""

from datetime import datetime

from src.models import Result


def validate_title(title: str) -> Result:
    """Validate task title.

    Args:
        title: The title to validate

    Returns:
        Result with success=True if valid, or error message if invalid

    Validation rules:
    - Required (non-empty after stripping whitespace)
    - 1-200 characters
    """
    if not title or not title.strip():
        return Result(
            success=False,
            message="Error: Title is required. Usage: add <title> [description]",
        )
    if len(title) > 200:
        return Result(
            success=False,
            message="Error: Title must be 1-200 characters",
        )
    return Result(success=True, message="Valid")


def validate_description(description: str) -> Result:
    """Validate task description.

    Args:
        description: The description to validate

    Returns:
        Result with success=True if valid, or error message if invalid

    Validation rules:
    - Optional (empty string allowed)
    - 0-1000 characters
    """
    if len(description) > 1000:
        return Result(
            success=False,
            message="Error: Description must be 0-1000 characters",
        )
    return Result(success=True, message="Valid")


def validate_id(id_str: str) -> Result:
    """Validate and parse task ID.

    Args:
        id_str: String representation of the ID

    Returns:
        Result with success=True and parsed ID in data field,
        or error message if invalid

    Validation rules:
    - Must be a valid integer
    - Must be positive (> 0)
    """
    try:
        id_val = int(id_str)
        if id_val <= 0:
            return Result(
                success=False,
                message="Error: Invalid task ID. ID must be a positive number",
            )
        return Result(success=True, message="Valid", data=id_val)
    except ValueError:
        return Result(
            success=False,
            message="Error: Invalid task ID. ID must be a positive number",
        )


def format_timestamp(dt: datetime) -> str:
    """Format datetime as ISO 8601 string.

    Args:
        dt: The datetime to format

    Returns:
        ISO 8601 formatted string (e.g., "2026-01-01T10:30:00+00:00")
    """
    return dt.isoformat()


def truncate(text: str, max_len: int = 30) -> str:
    """Truncate text with ellipsis if too long.

    Args:
        text: The text to truncate
        max_len: Maximum length (default 30)

    Returns:
        Original text if short enough, or truncated with "..."
    """
    if len(text) <= max_len:
        return text
    return text[: max_len - 3] + "..."
