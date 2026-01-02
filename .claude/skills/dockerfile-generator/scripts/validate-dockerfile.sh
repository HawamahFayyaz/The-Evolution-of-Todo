#!/bin/bash
# Validates Dockerfile for best practices

DOCKERFILE=$1

if [ ! -f "$DOCKERFILE" ]; then
    echo "❌ File not found: $DOCKERFILE"
    exit 1
fi

errors=0
warnings=0

# Check for FROM instruction
if ! grep -q "^FROM" "$DOCKERFILE"; then
    echo "❌ Missing FROM instruction"
    ((errors++))
fi

# Check for non-root user
if ! grep -q "USER" "$DOCKERFILE"; then
    echo "⚠️  No USER instruction (should not run as root)"
    ((warnings++))
fi

# Check for HEALTHCHECK
if ! grep -q "HEALTHCHECK" "$DOCKERFILE"; then
    echo "⚠️  No HEALTHCHECK instruction"
    ((warnings++))
fi

# Check for EXPOSE
if ! grep -q "EXPOSE" "$DOCKERFILE"; then
    echo "⚠️  No EXPOSE instruction"
    ((warnings++))
fi

# Check for CMD or ENTRYPOINT
if ! grep -q "CMD\|ENTRYPOINT" "$DOCKERFILE"; then
    echo "❌ Missing CMD or ENTRYPOINT"
    ((errors++))
fi

# Check for WORKDIR
if ! grep -q "WORKDIR" "$DOCKERFILE"; then
    echo "⚠️  No WORKDIR set"
    ((warnings++))
fi

# Check for multi-stage (AS keyword)
if ! grep -q "AS" "$DOCKERFILE"; then
    echo "⚠️  Not using multi-stage build"
    ((warnings++))
fi

# Check for apt-get without clean
if grep -q "apt-get install" "$DOCKERFILE" && ! grep -q "rm -rf /var/lib/apt/lists" "$DOCKERFILE"; then
    echo "⚠️  apt-get install without cleanup (bloats image)"
    ((warnings++))
fi

# Print results
if [ $errors -gt 0 ]; then
    echo ""
    echo "❌ Dockerfile validation FAILED with $errors errors"
    exit 1
fi

if [ $warnings -gt 0 ]; then
    echo ""
    echo "⚠️  Dockerfile has $warnings warnings"
fi

echo "✅ Dockerfile validation passed!"
exit 0
