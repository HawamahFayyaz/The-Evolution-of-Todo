"""Unit tests for validation and formatting utilities.

[From]: specs/003-task-schema/tasks.md T014
"""

from datetime import UTC, datetime

from src.utils import (
    format_timestamp,
    truncate,
    validate_description,
    validate_id,
    validate_title,
)


class TestValidateTitle:
    """Tests for validate_title function."""

    def test_valid_title(self) -> None:
        """Test valid title passes validation."""
        result = validate_title("Buy groceries")
        assert result.success is True

    def test_empty_title_fails(self) -> None:
        """Test empty title fails validation."""
        result = validate_title("")
        assert result.success is False
        assert "required" in result.message.lower()

    def test_whitespace_only_title_fails(self) -> None:
        """Test whitespace-only title fails validation."""
        result = validate_title("   ")
        assert result.success is False
        assert "required" in result.message.lower()

    def test_title_at_max_length(self) -> None:
        """Test title at exactly 200 characters passes."""
        title = "A" * 200
        result = validate_title(title)
        assert result.success is True

    def test_title_exceeds_max_length(self) -> None:
        """Test title over 200 characters fails."""
        title = "A" * 201
        result = validate_title(title)
        assert result.success is False
        assert "1-200" in result.message

    def test_title_with_special_characters(self) -> None:
        """Test title with special characters passes."""
        result = validate_title("Buy groceries: milk, eggs & bread!")
        assert result.success is True


class TestValidateDescription:
    """Tests for validate_description function."""

    def test_empty_description_valid(self) -> None:
        """Test empty description is valid."""
        result = validate_description("")
        assert result.success is True

    def test_valid_description(self) -> None:
        """Test valid description passes."""
        result = validate_description("Milk, eggs, bread from store")
        assert result.success is True

    def test_description_at_max_length(self) -> None:
        """Test description at exactly 1000 characters passes."""
        desc = "A" * 1000
        result = validate_description(desc)
        assert result.success is True

    def test_description_exceeds_max_length(self) -> None:
        """Test description over 1000 characters fails."""
        desc = "A" * 1001
        result = validate_description(desc)
        assert result.success is False
        assert "0-1000" in result.message


class TestValidateId:
    """Tests for validate_id function."""

    def test_valid_id(self) -> None:
        """Test valid ID passes and returns parsed value."""
        result = validate_id("1")
        assert result.success is True
        assert result.data == 1

    def test_large_valid_id(self) -> None:
        """Test large valid ID passes."""
        result = validate_id("99999")
        assert result.success is True
        assert result.data == 99999

    def test_zero_id_fails(self) -> None:
        """Test zero ID fails (must be positive)."""
        result = validate_id("0")
        assert result.success is False
        assert "positive" in result.message.lower()

    def test_negative_id_fails(self) -> None:
        """Test negative ID fails."""
        result = validate_id("-1")
        assert result.success is False
        assert "positive" in result.message.lower()

    def test_non_numeric_id_fails(self) -> None:
        """Test non-numeric ID fails."""
        result = validate_id("abc")
        assert result.success is False
        assert "positive number" in result.message.lower()

    def test_float_id_fails(self) -> None:
        """Test float ID fails."""
        result = validate_id("1.5")
        assert result.success is False


class TestFormatTimestamp:
    """Tests for format_timestamp function."""

    def test_format_utc_timestamp(self) -> None:
        """Test UTC timestamp formatting."""
        dt = datetime(2026, 1, 1, 10, 30, 0, tzinfo=UTC)
        result = format_timestamp(dt)
        assert "2026-01-01" in result
        assert "10:30:00" in result

    def test_format_returns_iso8601(self) -> None:
        """Test output is valid ISO 8601."""
        dt = datetime.now(UTC)
        result = format_timestamp(dt)
        # Should be parseable as ISO 8601
        parsed = datetime.fromisoformat(result)
        assert parsed.year == dt.year


class TestTruncate:
    """Tests for truncate function."""

    def test_short_text_unchanged(self) -> None:
        """Test short text is not truncated."""
        result = truncate("Hello", max_len=30)
        assert result == "Hello"

    def test_exact_length_unchanged(self) -> None:
        """Test text at exact max length is not truncated."""
        text = "A" * 30
        result = truncate(text, max_len=30)
        assert result == text

    def test_long_text_truncated(self) -> None:
        """Test long text is truncated with ellipsis."""
        text = "A" * 50
        result = truncate(text, max_len=30)
        assert len(result) == 30
        assert result.endswith("...")

    def test_custom_max_length(self) -> None:
        """Test custom max length."""
        text = "Hello World"
        result = truncate(text, max_len=8)
        assert len(result) == 8
        assert result == "Hello..."

    def test_empty_string(self) -> None:
        """Test empty string unchanged."""
        result = truncate("", max_len=30)
        assert result == ""
