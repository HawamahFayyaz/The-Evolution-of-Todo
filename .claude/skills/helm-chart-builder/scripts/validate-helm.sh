#!/bin/bash
# Validates Helm chart structure and syntax

CHART_DIR=$1

if [ ! -d "$CHART_DIR" ]; then
    echo "❌ Chart directory not found: $CHART_DIR"
    exit 1
fi

errors=0
warnings=0

# Check required files
required_files=("Chart.yaml" "values.yaml" "templates/deployment.yaml" "templates/service.yaml")

for file in "${required_files[@]}"; do
    if [ ! -f "$CHART_DIR/$file" ]; then
        echo "❌ Missing required file: $file"
        ((errors++))
    fi
done

# Check if Chart.yaml is valid
if [ -f "$CHART_DIR/Chart.yaml" ]; then
    if ! grep -q "name:" "$CHART_DIR/Chart.yaml"; then
        echo "❌ Chart.yaml missing 'name' field"
        ((errors++))
    fi
    if ! grep -q "version:" "$CHART_DIR/Chart.yaml"; then
        echo "❌ Chart.yaml missing 'version' field"
        ((errors++))
    fi
fi

# Run helm lint
echo "Running helm lint..."
if helm lint "$CHART_DIR"; then
    echo "✅ Helm lint passed"
else
    echo "❌ Helm lint failed"
    ((errors++))
fi

# Check for hardcoded values in templates
echo "Checking for hardcoded values..."
hardcoded=$(grep -r -n -E "(localhost|192\.168|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)" "$CHART_DIR/templates/" 2>/dev/null)
if [ -n "$hardcoded" ]; then
    echo "⚠️  Possible hardcoded IPs/hostnames found:"
    echo "$hardcoded"
    ((warnings++))
fi

# Check for resource limits
if ! grep -r "resources:" "$CHART_DIR/templates/" | grep -q "limits:"; then
    echo "⚠️  No resource limits found in deployments"
    ((warnings++))
fi

# Check for health probes
if ! grep -r "livenessProbe:" "$CHART_DIR/templates/" > /dev/null; then
    echo "⚠️  No liveness probes found"
    ((warnings++))
fi

if ! grep -r "readinessProbe:" "$CHART_DIR/templates/" > /dev/null; then
    echo "⚠️  No readiness probes found"
    ((warnings++))
fi

# Print results
echo ""
if [ $errors -gt 0 ]; then
    echo "❌ Helm chart validation FAILED with $errors errors"
    exit 1
fi

if [ $warnings -gt 0 ]; then
    echo "⚠️  Helm chart has $warnings warnings"
fi

echo "✅ Helm chart validation passed!"
exit 0
