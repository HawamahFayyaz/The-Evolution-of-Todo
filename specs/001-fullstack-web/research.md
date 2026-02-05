# Research: Phase II Full-Stack Web Application

**Feature**: 001-fullstack-web
**Created**: 2026-01-15
**Status**: Complete

## Overview

This document consolidates research findings for the Phase II implementation. All technology choices are based on the constitution's tech stack requirements and best practices for each domain.

---

## 1. Better Auth + JWT Configuration

### Decision
Use Better Auth for frontend authentication with JWT tokens verified by FastAPI backend.

### Rationale
- Better Auth is specified in the constitution's Phase II tech stack
- Provides built-in email/password authentication
- Issues JWT tokens that can be verified by any backend
- Supports httpOnly cookies for secure token storage

### Best Practices
1. **Shared Secret**: Both frontend and backend must use identical `BETTER_AUTH_SECRET`
2. **Secret Length**: Minimum 32 characters for HS256 security
3. **Token Claims**: Use standard claims (sub, iat, exp) plus custom (email, name)
4. **Cookie Settings**: httpOnly=true, secure=true (production), sameSite=lax

### Implementation Reference
```typescript
// Frontend: lib/auth.ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: /* Neon adapter */,
  emailAndPassword: { enabled: true },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});
```

```python
# Backend: auth.py
from jose import jwt, JWTError

def verify_token(token: str) -> dict:
    return jwt.decode(
        token,
        os.getenv("BETTER_AUTH_SECRET"),
        algorithms=["HS256"]
    )
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| NextAuth.js | Constitution specifies Better Auth |
| Auth0 | External dependency, complexity |
| Custom JWT | Better Auth handles user management |

---

## 2. SQLModel ORM Configuration

### Decision
Use SQLModel for all database operations with Neon PostgreSQL.

### Rationale
- Constitution specifies SQLModel as the only allowed ORM
- Combines Pydantic validation with SQLAlchemy ORM
- Type-safe models with automatic validation
- Direct integration with FastAPI

### Best Practices
1. **Audit Fields**: Include id, created_at, updated_at, deleted_at on all models
2. **Indexes**: Index user_id column for query performance
3. **Soft Deletes**: Use deleted_at timestamp, never hard delete
4. **Session Management**: Use FastAPI dependency injection

### Implementation Reference
```python
from sqlmodel import SQLModel, Field, Session, create_engine
from datetime import datetime

class Task(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    title: str = Field(max_length=200)
    description: str = Field(default="", max_length=1000)
    completed: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    deleted_at: datetime | None = Field(default=None)
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Raw SQL | Constitution forbids direct SQL |
| SQLAlchemy | SQLModel preferred for Pydantic integration |
| Tortoise ORM | Not in constitution tech stack |

---

## 3. Neon PostgreSQL Connection

### Decision
Use Neon serverless PostgreSQL with connection string from environment variable.

### Rationale
- Specified in constitution Phase II tech stack
- Serverless with automatic scaling
- Free tier sufficient for development
- Standard PostgreSQL protocol

### Best Practices
1. **SSL Mode**: Always use `sslmode=require` for Neon connections
2. **Connection Pooling**: Neon handles pooling serverlessly
3. **Environment Variables**: Never hardcode connection string
4. **Timeouts**: Set reasonable connection timeouts

### Implementation Reference
```python
# database.py
import os
from sqlmodel import create_engine, SQLModel

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL, echo=False)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
```

### Connection String Format
```
postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require
```

---

## 4. Next.js 16+ App Router Patterns

### Decision
Use Next.js App Router with Server Components by default, Client Components for interactivity.

### Rationale
- Constitution specifies Next.js 16+ with App Router
- Server Components reduce client bundle size
- App Router provides nested layouts
- Built-in support for streaming and suspense

### Best Practices
1. **Server Components**: Default for data fetching and static content
2. **Client Components**: Use "use client" only for interactivity
3. **Async Params**: In Next.js 16, params and searchParams are Promises
4. **Route Groups**: Use (auth) folder for authentication pages

### Implementation Reference
```typescript
// app/dashboard/page.tsx (Server Component)
export default async function DashboardPage() {
  // params is a Promise in Next.js 16+
  const session = await auth.api.getSession();
  return <Dashboard user={session?.user} />;
}

// components/task-form.tsx (Client Component)
"use client";
export function TaskForm() {
  const [title, setTitle] = useState("");
  // Interactive form logic
}
```

### Alternatives Considered
| Alternative | Rejected Because |
|-------------|------------------|
| Pages Router | App Router is modern standard |
| Remix | Constitution specifies Next.js |
| SvelteKit | Not in constitution tech stack |

---

## 5. FastAPI Backend Structure

### Decision
Use FastAPI with route handlers in separate files, dependency injection for auth.

### Rationale
- Constitution specifies FastAPI for backend
- Automatic OpenAPI documentation
- Native async support
- Pydantic validation integration

### Best Practices
1. **Router Organization**: One router per resource (tasks.py)
2. **Dependencies**: Use `Depends()` for auth and database session
3. **Response Models**: Define explicit response types
4. **Error Handling**: Use HTTPException with clear messages

### Implementation Reference
```python
# routes/tasks.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("/")
async def list_tasks(
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    tasks = session.exec(
        select(Task)
        .where(Task.user_id == current_user)
        .where(Task.deleted_at.is_(None))
    ).all()
    return tasks
```

---

## 6. API Client Pattern (Frontend)

### Decision
Create dedicated API client layer in frontend for all backend calls.

### Rationale
- Constitution recommends API client pattern
- Centralizes authentication token handling
- Provides type-safe request/response
- Easy to mock for testing

### Best Practices
1. **Base Client**: Single fetch wrapper with token injection
2. **Resource Clients**: Separate files per resource (tasks.ts)
3. **Error Handling**: Consistent error response parsing
4. **Type Safety**: Use TypeScript generics for responses

### Implementation Reference
```typescript
// lib/api/client.ts
export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!response.ok) throw new ApiError(response);
  return response.json();
}

// lib/api/tasks.ts
export const tasksApi = {
  list: () => apiClient<Task[]>("/api/tasks"),
  create: (data: CreateTask) => apiClient<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  }),
};
```

---

## 7. CORS Configuration

### Decision
Configure CORS to allow frontend origins with credentials.

### Rationale
- Frontend and backend on different origins
- Need to send cookies/auth headers cross-origin
- Must be explicitly configured in FastAPI

### Best Practices
1. **Explicit Origins**: List allowed origins, avoid wildcards
2. **Credentials**: Set `allow_credentials=True` for cookies
3. **Methods**: Allow only needed HTTP methods
4. **Headers**: Allow Authorization and Content-Type

### Implementation Reference
```python
# main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)
```

---

## 8. Error Response Format

### Decision
Use consistent JSON error format across all endpoints.

### Rationale
- Frontend needs predictable error structure
- Constitution requires clear error messages
- Enables proper error display in UI

### Best Practices
1. **Structure**: Include error code, message, and optional details
2. **HTTP Codes**: Use appropriate status codes (401, 403, 404, 422, 500)
3. **User Messages**: Provide actionable user-facing messages
4. **Logging**: Log detailed errors server-side, sanitize for clients

### Implementation Reference
```python
# Error response format
{
  "detail": {
    "code": "INVALID_TOKEN",
    "message": "Session expired. Please sign in again.",
    "field": null  # Optional, for validation errors
  }
}

# FastAPI exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
```

---

## 9. User Data Isolation Pattern

### Decision
All database queries MUST filter by authenticated user_id from JWT.

### Rationale
- Constitution Principle IX (Multi-User Data Isolation)
- Critical security requirement
- Prevents data leakage between users

### Best Practices
1. **Extract from JWT**: User ID comes from token `sub` claim ONLY
2. **Filter All Queries**: Every SELECT includes `WHERE user_id = ?`
3. **Verify Ownership**: Before UPDATE/DELETE, check task.user_id matches
4. **Never Trust Client**: Ignore any user_id in request body/params

### Implementation Reference
```python
# CORRECT: User ID from JWT
@router.get("/{task_id}")
async def get_task(
    task_id: int,
    current_user: str = Depends(get_current_user),  # From JWT
    session: Session = Depends(get_session)
):
    task = session.exec(
        select(Task)
        .where(Task.id == task_id)
        .where(Task.user_id == current_user)  # Always filter!
        .where(Task.deleted_at.is_(None))
    ).first()
    if not task:
        raise HTTPException(404, "Task not found")
    return task

# WRONG: Never do this!
@router.get("/{task_id}")
async def get_task_insecure(task_id: int, user_id: str):  # From request!
    # SECURITY VULNERABILITY - user_id from client
```

---

## 10. Soft Delete Implementation

### Decision
All deletes set `deleted_at` timestamp instead of removing data.

### Rationale
- Constitution forbids hard deletes
- Allows data recovery
- Maintains audit trail
- Required for compliance

### Best Practices
1. **Nullable Timestamp**: `deleted_at: datetime | None`
2. **Filter Queries**: All SELECTs include `WHERE deleted_at IS NULL`
3. **Delete Operation**: `UPDATE ... SET deleted_at = utcnow()`
4. **Index**: Add index on deleted_at for query performance

### Implementation Reference
```python
# Delete endpoint (soft delete)
@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: int,
    current_user: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    task = session.exec(
        select(Task)
        .where(Task.id == task_id)
        .where(Task.user_id == current_user)
        .where(Task.deleted_at.is_(None))
    ).first()
    if not task:
        raise HTTPException(404, "Task not found")

    task.deleted_at = datetime.utcnow()
    session.add(task)
    session.commit()
    return None
```

---

## Summary

All research items have been resolved. The implementation can proceed with:

| Item | Decision | Status |
|------|----------|--------|
| Authentication | Better Auth + JWT | ✅ Resolved |
| ORM | SQLModel | ✅ Resolved |
| Database | Neon PostgreSQL | ✅ Resolved |
| Frontend | Next.js 16+ App Router | ✅ Resolved |
| Backend | FastAPI | ✅ Resolved |
| API Client | Centralized client layer | ✅ Resolved |
| CORS | Explicit origins, credentials | ✅ Resolved |
| Errors | Consistent JSON format | ✅ Resolved |
| Data Isolation | user_id from JWT only | ✅ Resolved |
| Soft Deletes | deleted_at timestamp | ✅ Resolved |
