#!/usr/bin/env python3
"""Validates Dapr component files"""
import sys
import yaml
from pathlib import Path

REQUIRED_FIELDS = ["apiVersion", "kind", "metadata", "spec"]
VALID_TYPES = [
    "pubsub.kafka",
    "state.postgresql",
    "jobs.scheduler",
    "secretstores.kubernetes"
]

def validate_dapr_component(filepath: str):
    """Check if Dapr component is valid"""
    path = Path(filepath)
    if not path.exists():
        print(f"❌ File not found: {filepath}")
        sys.exit(1)

    with open(path, 'r') as f:
        try:
            component = yaml.safe_load(f)
        except yaml.YAMLError as e:
            print(f"❌ Invalid YAML: {e}")
            sys.exit(1)

    errors = []
    warnings = []

    # Check required top-level fields
    for field in REQUIRED_FIELDS:
        if field not in component:
            errors.append(f"Missing required field: {field}")

    # Check apiVersion
    if component.get("apiVersion") != "dapr.io/v1alpha1":
        warnings.append("apiVersion should be 'dapr.io/v1alpha1'")

    # Check kind
    if component.get("kind") != "Component":
        errors.append("kind must be 'Component'")

    # Check metadata.name
    if "metadata" in component and "name" not in component["metadata"]:
        errors.append("metadata.name is required")

    # Check spec.type
    if "spec" in component:
        comp_type = component["spec"].get("type")
        if not comp_type:
            errors.append("spec.type is required")
        elif comp_type not in VALID_TYPES:
            warnings.append(f"Component type '{comp_type}' not in common types: {VALID_TYPES}")

    # Check spec.metadata exists
    if "spec" in component and "metadata" not in component["spec"]:
        warnings.append("spec.metadata should contain component configuration")

    # Print results
    if errors:
        print("❌ Dapr component validation FAILED:")
        for error in errors:
            print(f"  • {error}")
        sys.exit(1)

    if warnings:
        print("⚠️  Warnings:")
        for warning in warnings:
            print(f"  • {warning}")

    print("✅ Dapr component validation passed!")
    print(f"   Component: {component.get('metadata', {}).get('name')}")
    print(f"   Type: {component.get('spec', {}).get('type')}")
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python validate-dapr.py <component.yaml>")
        sys.exit(1)

    validate_dapr_component(sys.argv[1])
