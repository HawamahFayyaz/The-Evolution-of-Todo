#!/usr/bin/env python3
"""Validates GitHub Actions workflow files"""
import sys
import yaml
from pathlib import Path

REQUIRED_JOBS = ["lint", "test"]
REQUIRED_TRIGGERS = ["pull_request", "push"]

def validate_workflow(filepath: str):
    """Check if workflow follows best practices"""
    path = Path(filepath)
    if not path.exists():
        print(f"❌ File not found: {filepath}")
        sys.exit(1)

    with open(path, 'r') as f:
        try:
            workflow = yaml.safe_load(f)
        except yaml.YAMLError as e:
            print(f"❌ Invalid YAML: {e}")
            sys.exit(1)

    errors = []
    warnings = []

    # Check for 'on' triggers
    if 'on' not in workflow:
        errors.append("Missing 'on' triggers")
    elif isinstance(workflow['on'], dict):
        triggers = list(workflow['on'].keys())
        if not any(t in triggers for t in REQUIRED_TRIGGERS):
            warnings.append(f"Consider adding triggers: {REQUIRED_TRIGGERS}")

    # Check for jobs
    if 'jobs' not in workflow:
        errors.append("Missing 'jobs' section")
    else:
        jobs = list(workflow['jobs'].keys())
        print(f"Found jobs: {', '.join(jobs)}")

        # Check for recommended jobs
        for required_job in REQUIRED_JOBS:
            if not any(required_job in job.lower() for job in jobs):
                warnings.append(f"Consider adding '{required_job}' job")

        # Check each job
        for job_name, job in workflow['jobs'].items():
            if 'runs-on' not in job:
                errors.append(f"Job '{job_name}': Missing 'runs-on'")

            if 'steps' not in job:
                errors.append(f"Job '{job_name}': Missing 'steps'")

            # Check for checkout step
            if 'steps' in job:
                has_checkout = any(
                    'uses' in step and 'checkout' in step['uses']
                    for step in job['steps']
                )
                if not has_checkout:
                    warnings.append(f"Job '{job_name}': Missing checkout step")

    # Check for caching
    workflow_str = str(workflow)
    if 'cache' not in workflow_str.lower():
        warnings.append("Consider adding dependency caching for faster builds")

    # Print results
    if errors:
        print("\n❌ Workflow validation FAILED:")
        for error in errors:
            print(f"  • {error}")
        sys.exit(1)

    if warnings:
        print("\n⚠️  Warnings:")
        for warning in warnings:
            print(f"  • {warning}")

    print("\n✅ Workflow validation passed!")
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python validate-workflow.py <workflow.yml>")
        sys.exit(1)

    validate_workflow(sys.argv[1])
