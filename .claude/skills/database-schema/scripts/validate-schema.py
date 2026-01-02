#!/usr/bin/env python3
"""Validates SQLModel schema files for required patterns"""
import sys
import ast
from pathlib import Path

REQUIRED_FIELDS = {"id", "created_at", "updated_at", "deleted_at"}

def validate_schema(filepath: str):
    """Check if schema follows best practices"""
    path = Path(filepath)
    if not path.exists():
        print(f"❌ File not found: {filepath}")
        sys.exit(1)

    with open(path, 'r') as f:
        content = f.read()

    try:
        tree = ast.parse(content)
    except SyntaxError as e:
        print(f"❌ Syntax error: {e}")
        sys.exit(1)

    errors = []
    warnings = []

    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            # Skip if not a table model
            if not has_table_true(node):
                continue

            class_name = node.name
            field_names = get_field_names(node)

            # Check required audit fields
            missing_fields = REQUIRED_FIELDS - field_names
            if missing_fields:
                errors.append(f"{class_name}: Missing audit fields: {missing_fields}")

            # Check for foreign keys without indexes
            for item in node.body:
                if isinstance(item, ast.AnnAssign) and item.target.id.endswith("_id"):
                    if not has_index_true(item):
                        warnings.append(f"{class_name}.{item.target.id}: Foreign key should have index=True")

            # Check for string fields without max_length
            for item in node.body:
                if isinstance(item, ast.AnnAssign):
                    if is_str_field(item) and not has_max_length(item):
                        warnings.append(f"{class_name}.{item.target.id}: String field should have max_length")

    # Print results
    if errors:
        print("❌ Schema validation FAILED:")
        for error in errors:
            print(f"  • {error}")
        sys.exit(1)

    if warnings:
        print("⚠️  Warnings:")
        for warning in warnings:
            print(f"  • {warning}")

    print("✅ Schema validation passed!")
    sys.exit(0)

def has_table_true(class_node):
    """Check if class has table=True"""
    for base in class_node.bases:
        if isinstance(base, ast.Call) and hasattr(base.func, 'id'):
            for keyword in base.keywords:
                if keyword.arg == 'table' and isinstance(keyword.value, ast.Constant):
                    return keyword.value.value is True
    return False

def get_field_names(class_node):
    """Extract field names from class"""
    fields = set()
    for item in class_node.body:
        if isinstance(item, ast.AnnAssign) and hasattr(item.target, 'id'):
            fields.add(item.target.id)
    return fields

def has_index_true(ann_assign):
    """Check if Field has index=True"""
    if isinstance(ann_assign.value, ast.Call):
        for keyword in ann_assign.value.keywords:
            if keyword.arg == 'index' and isinstance(keyword.value, ast.Constant):
                return keyword.value.value is True
    return False

def has_max_length(ann_assign):
    """Check if Field has max_length"""
    if isinstance(ann_assign.value, ast.Call):
        for keyword in ann_assign.value.keywords:
            if keyword.arg == 'max_length':
                return True
    return False

def is_str_field(ann_assign):
    """Check if field type is str"""
    if isinstance(ann_assign.annotation, ast.Name):
        return ann_assign.annotation.id == 'str'
    return False

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python validate-schema.py <schema_file.py>")
        sys.exit(1)

    validate_schema(sys.argv[1])
