#!/usr/bin/env python3
"""Validates API endpoint specifications for completeness"""
import sys
from pathlib import Path

REQUIRED_SECTIONS = [
    "**Authentication**:",
    "**Response (Success)**:",
    "**Response (Errors)**:",
    "**Idempotency**:",
    "**Business Rules**:"
]

HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"]
STATUS_CODES = ["200", "201", "204", "400", "401", "403", "404", "422", "500"]

def validate_api_spec(filepath: str):
    """Check if API spec has required sections and follows patterns"""
    path = Path(filepath)
    if not path.exists():
        print(f"❌ File not found: {filepath}")
        sys.exit(1)

    with open(path, 'r') as f:
        content = f.read()

    errors = []
    warnings = []

    # Check for HTTP method in title
    has_method = any(method in content[:100] for method in HTTP_METHODS)
    if not has_method:
        errors.append(f"Missing HTTP method in title (expected: {', '.join(HTTP_METHODS)})")

    # Check required sections
    for section in REQUIRED_SECTIONS:
        if section not in content:
            errors.append(f"Missing required section: {section}")

    # Check for error response format
    if '"error":' not in content and "Response (Errors)" in content:
        warnings.append("Error responses should use {error, code, details} format")

    # Check for at least one error status code
    has_error_code = any(code in content for code in ["400", "401", "403", "404", "422", "500"])
    if not has_error_code:
        warnings.append("Should document at least one error status code")

    # Check for authentication mention
    if "JWT" not in content and "Bearer" not in content and "Authentication" in content:
        warnings.append("Should specify authentication mechanism (e.g., JWT Bearer token)")

    # Check for validation rules
    if "POST" in content or "PUT" in content or "PATCH" in content:
        if "min_length" not in content.lower() and "max_length" not in content.lower():
            warnings.append("Should specify validation rules (min_length, max_length, etc.)")

    # Check for business rules
    if "**ALWAYS:**" not in content and "**NEVER:**" not in content:
        warnings.append("Should include business rules with ALWAYS/NEVER statements")

    # Print results
    if errors:
        print("❌ API Spec validation FAILED:")
        for error in errors:
            print(f"  • {error}")
        sys.exit(1)

    if warnings:
        print("⚠️  Warnings:")
        for warning in warnings:
            print(f"  • {warning}")

    print("✅ API Spec validation passed!")
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python validate-endpoints.py <api_spec.md>")
        sys.exit(1)

    validate_api_spec(sys.argv[1])
