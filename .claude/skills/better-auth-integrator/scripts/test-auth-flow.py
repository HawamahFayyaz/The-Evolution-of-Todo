#!/usr/bin/env python3
"""Test authentication flow end-to-end"""
import requests
import sys

API_BASE = "http://localhost:8000"
FRONTEND_BASE = "http://localhost:3000"

def test_auth_flow():
    """Test complete auth flow"""
    print("Testing authentication flow...\n")

    errors = []

    # Test 1: Access protected endpoint without token
    print("Test 1: Accessing protected endpoint without token...")
    response = requests.get(f"{API_BASE}/api/tasks")
    if response.status_code == 401:
        print("✅ Correctly returns 401 Unauthorized\n")
    else:
        errors.append(f"Expected 401, got {response.status_code}")
        print(f"❌ Expected 401, got {response.status_code}\n")

    # Test 2: Access with invalid token
    print("Test 2: Accessing with invalid token...")
    response = requests.get(
        f"{API_BASE}/api/tasks",
        headers={"Authorization": "Bearer invalid_token_12345"}
    )
    if response.status_code == 401:
        print("✅ Correctly rejects invalid token\n")
    else:
        errors.append(f"Invalid token should return 401, got {response.status_code}")
        print(f"❌ Invalid token should return 401, got {response.status_code}\n")

    # Test 3: Check frontend auth page exists
    print("Test 3: Checking frontend auth pages...")
    response = requests.get(f"{FRONTEND_BASE}/login")
    if response.status_code == 200:
        print("✅ Login page accessible\n")
    else:
        errors.append(f"Login page returned {response.status_code}")
        print(f"⚠️  Login page returned {response.status_code}\n")

    # Test 4: Check Better Auth API endpoint
    print("Test 4: Checking Better Auth API...")
    response = requests.get(f"{FRONTEND_BASE}/api/auth/session")
    if response.status_code in [200, 401]:  # 401 if not logged in is ok
        print("✅ Better Auth API responding\n")
    else:
        errors.append(f"Better Auth API returned {response.status_code}")
        print(f"⚠️  Better Auth API returned {response.status_code}\n")

    # Print results
    if errors:
        print("❌ Authentication flow test FAILED:")
        for error in errors:
            print(f"  • {error}")
        sys.exit(1)

    print("✅ All authentication tests passed!")
    print("\nManual test required:")
    print("1. Go to http://localhost:3000/signup")
    print("2. Create account")
    print("3. Login")
    print("4. Verify you can access dashboard")
    print("5. Verify API calls work in dashboard")
    sys.exit(0)

if __name__ == "__main__":
    try:
        test_auth_flow()
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to API or frontend")
        print("Make sure both are running:")
        print("  - Frontend: npm run dev (port 3000)")
        print("  - Backend: uvicorn app.main:app --reload (port 8000)")
        sys.exit(1)
