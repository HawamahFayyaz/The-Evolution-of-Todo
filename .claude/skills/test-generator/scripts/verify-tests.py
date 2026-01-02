#!/usr/bin/env python3
"""Verifies test files exist and coverage meets threshold"""
import sys
import subprocess
from pathlib import Path

COVERAGE_THRESHOLD = 80  # 80% minimum

def verify_tests():
    """Run tests and check coverage"""
    errors = []
    warnings = []

    # Check if test directory exists
    if not Path("tests").exists():
        errors.append("tests/ directory not found")
        print("❌ Test verification failed:")
        for error in errors:
            print(f"  • {error}")
        sys.exit(1)

    # Count test files
    test_files = list(Path("tests").rglob("test_*.py"))
    if len(test_files) == 0:
        errors.append("No test files found (test_*.py)")

    print(f"Found {len(test_files)} test files")

    # Run pytest with coverage
    try:
        result = subprocess.run(
            ["pytest", "tests/", "--cov=app", "--cov-report=term-missing"],
            capture_output=True,
            text=True
        )

        # Parse coverage from output
        for line in result.stdout.split("\n"):
            if "TOTAL" in line:
                parts = line.split()
                if len(parts) >= 4:
                    coverage = int(parts[3].replace("%", ""))
                    print(f"Coverage: {coverage}%")

                    if coverage < COVERAGE_THRESHOLD:
                        errors.append(f"Coverage {coverage}% below threshold {COVERAGE_THRESHOLD}%")
                    elif coverage < COVERAGE_THRESHOLD + 10:
                        warnings.append(f"Coverage {coverage}% is close to threshold")

        # Check for test failures
        if result.returncode != 0:
            errors.append("Some tests failed")
            print(result.stdout)

    except FileNotFoundError:
        errors.append("pytest not installed (run: pip install pytest pytest-cov)")

    # Print results
    if errors:
        print("\n❌ Test verification FAILED:")
        for error in errors:
            print(f"  • {error}")
        sys.exit(1)

    if warnings:
        print("\n⚠️  Warnings:")
        for warning in warnings:
            print(f"  • {warning}")

    print("\n✅ Test verification passed!")
    sys.exit(0)

if __name__ == "__main__":
    verify_tests()
