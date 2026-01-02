#!/usr/bin/env python3
"""Validates feature specification files for completeness"""
import sys
from pathlib import Path

REQUIRED_SECTIONS = [
    "# Feature:",
    "## User Story",
    "## Acceptance Criteria",
    "## Edge Cases",
    "## Business Rules"
]

RECOMMENDED_SECTIONS = [
    "## Constitution Alignment",
    "## Dependencies",
    "## Out of Scope"
]

def validate_spec(filepath: str):
    """Check if spec has required sections"""
    path = Path(filepath)
    if not path.exists():
        print(f"❌ File not found: {filepath}")
        sys.exit(1)

    with open(path, 'r') as f:
        content = f.read()

    errors = []
    warnings = []

    # Check required sections
    for section in REQUIRED_SECTIONS:
        if section not in content:
            errors.append(f"Missing required section: {section}")

    # Check recommended sections
    for section in RECOMMENDED_SECTIONS:
        if section not in content:
            warnings.append(f"Missing recommended section: {section}")

    # Check user story format
    if "AS A" not in content or "I WANT" not in content or "SO THAT" not in content:
        errors.append("User Story must follow 'AS A... I WANT... SO THAT...' format")

    # Check for testable acceptance criteria
    if "- [ ]" not in content and "Acceptance Criteria" in content:
        warnings.append("Acceptance Criteria should use checkbox format (- [ ])")

    # Check for business rules
    if "**ALWAYS:**" not in content and "**NEVER:**" not in content:
        warnings.append("Business Rules should include ALWAYS and NEVER statements")

    # Print results
    if errors:
        print("❌ Spec validation FAILED:")
        for error in errors:
            print(f"  • {error}")
        sys.exit(1)

    if warnings:
        print("⚠️  Warnings:")
        for warning in warnings:
            print(f"  • {warning}")

    print("✅ Spec validation passed!")
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python validate-spec.py <spec_file.md>")
        sys.exit(1)

    validate_spec(sys.argv[1])
