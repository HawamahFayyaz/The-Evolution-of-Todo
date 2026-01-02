#!/usr/bin/env python3
"""Validates event schema files"""
import sys
import yaml
from pathlib import Path

REQUIRED_FIELDS = ["event_id", "event_type", "event_version", "timestamp", "source", "data"]

def validate_event_schema(filepath: str):
    """Check if event schema is complete"""
    path = Path(filepath)
    if not path.exists():
        print(f"❌ File not found: {filepath}")
        sys.exit(1)

    with open(path, 'r') as f:
        try:
            schema = yaml.safe_load(f)
        except yaml.YAMLError as e:
            print(f"❌ Invalid YAML: {e}")
            sys.exit(1)

    errors = []
    warnings = []

    # Check required top-level fields
    required_top_level = ["event_type", "version", "description", "topic", "schema"]
    for field in required_top_level:
        if field not in schema:
            errors.append(f"Missing required field: {field}")

    # Check schema structure
    if "schema" in schema:
        schema_fields = set(schema["schema"].keys())
        missing_fields = set(REQUIRED_FIELDS) - schema_fields
        if missing_fields:
            errors.append(f"Schema missing required fields: {missing_fields}")

    # Check if example is provided
    if "example" not in schema:
        warnings.append("No example provided (recommended for documentation)")

    # Check if consumers are listed
    if "consumers" not in schema:
        warnings.append("No consumers listed (who will subscribe to this event?)")

    # Validate event_type naming convention
    if "event_type" in schema:
        event_type = schema["event_type"]
        if "." not in event_type:
            warnings.append(f"Event type '{event_type}' should use dot notation (e.g., 'task.created')")
        if event_type != event_type.lower():
            warnings.append(f"Event type '{event_type}' should be lowercase")

    # Print results
    if errors:
        print("❌ Event schema validation FAILED:")
        for error in errors:
            print(f"  • {error}")
        sys.exit(1)

    if warnings:
        print("⚠️  Warnings:")
        for warning in warnings:
            print(f"  • {warning}")

    print("✅ Event schema validation passed!")
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python validate-events.py <event_schema.yml>")
        sys.exit(1)

    validate_event_schema(sys.argv[1])
