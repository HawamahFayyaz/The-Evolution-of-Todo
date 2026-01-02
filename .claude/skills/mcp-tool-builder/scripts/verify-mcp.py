#!/usr/bin/env python3
"""Validates MCP tool definitions for correctness"""
import sys
import ast
from pathlib import Path

REQUIRED_TOOLS = {
    "add_task",
    "list_tasks",
    "complete_task",
    "delete_task",
    "update_task"
}

def verify_mcp_server(filepath: str):
    """Check if MCP server follows best practices"""
    path = Path(filepath)
    if not path.exists():
        print(f"❌ File not found: {filepath}")
        sys.exit(1)

    with open(path, 'r') as f:
        content = f.read()

    errors = []
    warnings = []
    found_tools = set()

    try:
        tree = ast.parse(content)
    except SyntaxError as e:
        print(f"❌ Syntax error: {e}")
        sys.exit(1)

    # Check for required imports
    if "from mcp.server import" not in content:
        errors.append("Missing MCP server import")

    if "from sqlmodel import" not in content and "database" not in content.lower():
        warnings.append("No database import found - tools may be stateful")

    # Check for tool definitions
    for node in ast.walk(tree):
        if isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id.endswith("_tool"):
                    tool_name = target.id.replace("_tool", "")
                    found_tools.add(tool_name)

                    # Check if Tool has required fields
                    if isinstance(node.value, ast.Call):
                        keywords = {kw.arg for kw in node.value.keywords}
                        if "name" not in keywords:
                            errors.append(f"{tool_name}: Missing 'name' field")
                        if "description" not in keywords:
                            errors.append(f"{tool_name}: Missing 'description' field")
                        if "inputSchema" not in keywords:
                            errors.append(f"{tool_name}: Missing 'inputSchema' field")

        # Check for stateful patterns (bad!)
        if isinstance(node, ast.Assign):
            if any(isinstance(t, ast.Name) and ("cache" in t.id.lower() or "state" in t.id.lower())
                   for t in node.targets):
                warnings.append("Possible stateful pattern detected (global state variable)")

    # Check for required tools
    missing_tools = REQUIRED_TOOLS - found_tools
    if missing_tools:
        errors.append(f"Missing required tools: {missing_tools}")

    # Check for user_id in tool handlers
    if "user_id" not in content:
        errors.append("No user_id parameter found - tools must support multi-user")

    # Check for error handling
    if "try:" not in content or "except" not in content:
        warnings.append("No error handling found - tools should catch exceptions")

    # Check for consistent return format
    if '"success"' not in content and "'success'" not in content:
        warnings.append("Tools should return consistent {success: bool, ...} format")

    # Print results
    if errors:
        print("❌ MCP Server validation FAILED:")
        for error in errors:
            print(f"  • {error}")
        sys.exit(1)

    if warnings:
        print("⚠️  Warnings:")
        for warning in warnings:
            print(f"  • {warning}")

    print(f"✅ MCP Server validation passed!")
    print(f"   Found {len(found_tools)} tools: {', '.join(sorted(found_tools))}")
    sys.exit(0)

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python verify-mcp.py <mcp_server.py>")
        sys.exit(1)

    verify_mcp_server(sys.argv[1])
