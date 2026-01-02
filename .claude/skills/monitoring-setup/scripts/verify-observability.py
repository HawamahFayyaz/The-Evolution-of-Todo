#!/usr/bin/env python3
"""Verifies observability setup is working"""
import sys
import requests
from time import sleep

def verify_observability():
    """Check if monitoring endpoints are accessible"""
    errors = []
    warnings = []

    # Check Prometheus metrics endpoint
    try:
        response = requests.get("http://localhost:8000/metrics", timeout=5)
        if response.status_code == 200:
            print("✅ Metrics endpoint accessible")

            # Check for required metrics
            content = response.text
            required_metrics = [
                "http_requests_total",
                "http_request_duration_seconds"
            ]

            for metric in required_metrics:
                if metric not in content:
                    warnings.append(f"Metric '{metric}' not found in /metrics")
        else:
            errors.append(f"Metrics endpoint returned {response.status_code}")
    except requests.exceptions.RequestException as e:
        errors.append(f"Cannot reach metrics endpoint: {e}")

    # Check health endpoint
    try:
        response = requests.get("http://localhost:8000/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health endpoint accessible")
        else:
            warnings.append(f"Health endpoint returned {response.status_code}")
    except requests.exceptions.RequestException:
        warnings.append("Health endpoint not accessible")

    # Check Prometheus is scraping
    try:
        response = requests.get("http://localhost:9090/api/v1/query?query=up", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "success":
                print("✅ Prometheus is running")
            else:
                warnings.append("Prometheus query returned non-success status")
        else:
            warnings.append("Prometheus not accessible")
    except requests.exceptions.RequestException:
        warnings.append("Prometheus not running or not accessible at localhost:9090")

    # Check Grafana
    try:
        response = requests.get("http://localhost:3000/api/health", timeout=5)
        if response.status_code == 200:
            print("✅ Grafana is running")
        else:
            warnings.append("Grafana not accessible")
    except requests.exceptions.RequestException:
        warnings.append("Grafana not running or not accessible at localhost:3000")

    # Print results
    if errors:
        print("\n❌ Observability verification FAILED:")
        for error in errors:
            print(f"  • {error}")
        sys.exit(1)

    if warnings:
        print("\n⚠️  Warnings:")
        for warning in warnings:
            print(f"  • {warning}")

    print("\n✅ Observability verification passed!")
    sys.exit(0)

if __name__ == "__main__":
    verify_observability()
