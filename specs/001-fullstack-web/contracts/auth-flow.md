# Authentication Contract: Better Auth + JWT

**Feature**: 001-fullstack-web
**Created**: 2026-01-15
**Status**: Draft
**Version**: 1.0.0

## Overview

This document defines the authentication architecture for the Phase II multi-user todo application. Authentication is handled by Better Auth on the frontend with JWT tokens verified by the FastAPI backend.

## Authentication Flows

### 1. User Signup

```
┌─────────┐     ┌─────────────┐     ┌──────────┐     ┌──────────┐
│  User   │────▶│   Signup    │────▶│  Better  │────▶│ Database │
│         │     │    Form     │     │   Auth   │     │  (users) │
└─────────┘     └─────────────┘     └──────────┘     └──────────┘
                                          │
                                          ▼
                                    ┌──────────┐
                                    │   JWT    │
                                    │  Token   │
                                    └──────────┘
                                          │
                                          ▼
                                    ┌──────────┐
                                    │ httpOnly │
                                    │  Cookie  │
                                    └──────────┘
```

**Steps**:
1. User fills signup form (email, password, name)
2. Better Auth validates input
3. Better Auth creates user in database
4. Better Auth generates JWT token with user claims
5. Frontend stores token in httpOnly cookie
6. User redirected to dashboard

### 2. User Sign-in

```
┌─────────┐     ┌─────────────┐     ┌──────────┐     ┌──────────┐
│  User   │────▶│   Login     │────▶│  Better  │────▶│ Database │
│         │     │    Form     │     │   Auth   │     │  (users) │
└─────────┘     └─────────────┘     └──────────┘     └──────────┘
                                          │
                                          ▼ (if valid)
                                    ┌──────────┐
                                    │   JWT    │
                                    │  Token   │
                                    └──────────┘
```

**Steps**:
1. User fills login form (email, password)
2. Better Auth verifies credentials against database
3. If valid: Better Auth issues JWT token
4. If invalid: Return error message
5. Frontend stores token in httpOnly cookie
6. User redirected to dashboard

### 3. Authenticated API Request

```
┌─────────┐     ┌─────────────┐     ┌──────────┐     ┌──────────┐
│Frontend │────▶│   Cookie    │────▶│  Backend │────▶│ Database │
│         │     │  + Header   │     │  FastAPI │     │  (tasks) │
└─────────┘     └─────────────┘     └──────────┘     └──────────┘
                      │                   │
                      │             ┌─────┴─────┐
                      └────────────▶│  Verify   │
                        Bearer      │   JWT     │
                        Token       │ Extract   │
                                    │ user_id   │
                                    └───────────┘
```

**Steps**:
1. Frontend reads JWT from cookie
2. Frontend adds to Authorization header: `Bearer <token>`
3. Backend receives request
4. Backend verifies JWT signature with shared secret
5. Backend extracts `user_id` from token payload
6. Backend filters all data queries by `user_id`
7. Backend returns user-scoped response

### 4. User Logout

**Steps**:
1. Frontend clears httpOnly cookie
2. Frontend clears any local session state
3. User redirected to login page

## Token Specification

### JWT Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "iat": 1704067200,
    "exp": 1704672000
  }
}
```

### Payload Claims

| Claim | Type   | Required | Description                    |
|-------|--------|----------|--------------------------------|
| sub   | string | Yes      | User ID (primary identifier)   |
| email | string | Yes      | User's email address           |
| name  | string | No       | User's display name            |
| iat   | number | Yes      | Issued at timestamp            |
| exp   | number | Yes      | Expiration timestamp           |

### Token Configuration

| Parameter  | Value    | Description                          |
|------------|----------|--------------------------------------|
| Algorithm  | HS256    | HMAC with SHA-256                    |
| Expiration | 7 days   | Token validity period                |
| Issuer     | app      | Token issuer identifier              |

## Security Requirements

### Critical Requirements

| Requirement | Description                                          | Priority |
|-------------|------------------------------------------------------|----------|
| Shared Secret | Same BETTER_AUTH_SECRET in frontend AND backend   | CRITICAL |
| Secret Length | Minimum 32 characters                              | CRITICAL |
| Secret Storage | Environment variables only, never in code         | CRITICAL |
| Git Safety | Never commit secrets to version control              | CRITICAL |

### Token Security

| Mechanism       | Protection Against         | Implementation           |
|-----------------|----------------------------|--------------------------|
| httpOnly Cookie | XSS attacks                | Cookie flag              |
| Secure Flag     | Man-in-the-middle          | Production only          |
| SameSite        | CSRF attacks               | Lax or Strict            |
| Expiration      | Token theft                | 7-day limit              |
| Signature       | Token forgery              | HS256 verification       |

### Data Isolation

**CRITICAL SECURITY RULE**: User ID MUST be extracted from the verified JWT token, NEVER from request body or URL parameters.

```
CORRECT:
  user_id = jwt_payload["sub"]  // From verified token

WRONG (Security Vulnerability):
  user_id = request.body["user_id"]  // Attacker controlled!
```

## Environment Variables

### Frontend (.env.local)

```
NEXT_PUBLIC_APP_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)

```
BETTER_AUTH_SECRET=same-secret-as-frontend
DATABASE_URL=postgresql://user:pass@host/dbname
```

**Note**: `BETTER_AUTH_SECRET` MUST be identical in both environments.

## Error Responses

### Authentication Errors

| Status | Error Code              | Description                  | User Message                    |
|--------|-------------------------|------------------------------|---------------------------------|
| 401    | MISSING_TOKEN           | No Authorization header      | "Please sign in to continue"    |
| 401    | INVALID_TOKEN           | Malformed or invalid token   | "Session expired. Please sign in again" |
| 401    | EXPIRED_TOKEN           | Token past expiration        | "Session expired. Please sign in again" |
| 401    | INVALID_CREDENTIALS     | Wrong email/password         | "Invalid email or password"     |
| 403    | ACCESS_DENIED           | Valid token, wrong resource  | "You don't have access to this resource" |
| 422    | VALIDATION_ERROR        | Invalid signup data          | Specific field errors           |
| 429    | RATE_LIMITED            | Too many attempts            | "Too many attempts. Please wait." |

## Request/Response Examples

### Signup Request

```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "name": "John Doe"
}
```

### Signup Response (Success)

```http
HTTP/1.1 201 Created
Set-Cookie: auth_token=eyJ...; HttpOnly; Secure; SameSite=Lax

{
  "user": {
    "id": "user_abc123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Authenticated API Request

```http
GET /api/tasks
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Protected Endpoint Response

```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": 1,
    "user_id": "user_abc123",
    "title": "My task",
    "completed": false
  }
]
```

## Validation Rules

### Password Requirements

| Rule            | Value        | Error Message                      |
|-----------------|--------------|-------------------------------------|
| Minimum Length  | 8 characters | "Password must be at least 8 characters" |
| Required        | Yes          | "Password is required"              |

### Email Requirements

| Rule            | Value        | Error Message                      |
|-----------------|--------------|-------------------------------------|
| Format          | Valid email  | "Please enter a valid email address" |
| Unique          | Yes          | "This email is already registered"  |
| Required        | Yes          | "Email is required"                 |

## Session Management

### Session Lifecycle

1. **Creation**: On successful signup/signin
2. **Validation**: On every protected request
3. **Refresh**: Not implemented in Phase II (user re-authenticates after expiry)
4. **Destruction**: On explicit logout or token expiry

### Cookie Configuration

| Attribute | Value       | Purpose                            |
|-----------|-------------|------------------------------------|
| Name      | auth_token  | Cookie identifier                  |
| HttpOnly  | true        | Prevent JavaScript access (XSS)    |
| Secure    | true (prod) | HTTPS only in production           |
| SameSite  | Lax         | CSRF protection                    |
| Path      | /           | Available to all routes            |
| Max-Age   | 604800      | 7 days in seconds                  |

## Integration Points

| Component        | Responsibility                    | Interface              |
|------------------|-----------------------------------|------------------------|
| Better Auth      | User management, token issuance   | Frontend library       |
| FastAPI Backend  | Token verification, data access   | Authorization header   |
| PostgreSQL       | User storage (via Better Auth)    | SQLModel ORM           |
| httpOnly Cookie  | Token transport                   | Browser mechanism      |
