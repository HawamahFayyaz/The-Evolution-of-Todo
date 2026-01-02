#!/usr/bin/env python3
"""Verify all translation keys exist in both languages"""
import json
import sys
from pathlib import Path

def verify_translations(en_file: str, ur_file: str):
    """Check if translation files have matching keys"""

    # Load files
    with open(en_file, 'r', encoding='utf-8') as f:
        en_data = json.load(f)

    with open(ur_file, 'r', encoding='utf-8') as f:
        ur_data = json.load(f)

    errors = []
    warnings = []

    # Flatten nested keys
    def flatten(d, parent=''):
        items = []
        for k, v in d.items():
            key = f"{parent}.{k}" if parent else k
            if isinstance(v, dict):
                items.extend(flatten(v, key))
            else:
                items.append(key)
        return items

    en_keys = set(flatten(en_data))
    ur_keys = set(flatten(ur_data))

    # Check for missing keys
    missing_in_urdu = en_keys - ur_keys
    missing_in_english = ur_keys - en_keys

    if missing_in_urdu:
        errors.append(f"Missing in Urdu: {missing_in_urdu}")

    if missing_in_english:
        warnings.append(f"Extra in Urdu (not in English): {missing_in_english}")

    # Print results
    if errors:
        print("❌ Translation verification FAILED:")
        for error in errors:
            print(f"  • {error}")
        sys.exit(1)

    if warnings:
        print("⚠️  Warnings:")
        for warning in warnings:
            print(f"  • {warning}")

    print(f"✅ Translation verification passed!")
    print(f"   Total keys: {len(en_keys)}")
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python verify-translations.py <en.json> <ur.json>")
        sys.exit(1)

    verify_translations(sys.argv[1], sys.argv[2])
