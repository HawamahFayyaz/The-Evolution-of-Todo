---
name: better-auth-integrator
description: Integrate Better Auth with Next.js + FastAPI using JWT tokens for secure multi-user authentication
---

# Better Auth Integrator Skill

## Purpose
Set up end-to-end authentication flow using Better Auth for frontend session management and JWT tokens for backend API security in Phase II.

## Core Principles
1. **Shared Secret**: Frontend and backend use same secret for JWT signing/verification
2. **JWT in Headers**: Always send token in `Authorization: Bearer <token>` header
3. **User ID from Token**: Backend extracts user_id from JWT, never trusts client input
4. **Stateless Backend**: No session storage, JWT contains all auth info
5. **Secure by Default**: HTTPS in production, httpOnly cookies

## When to Use
- Phase II: Adding user authentication
- Securing REST API endpoints
- Multi-user data isolation
- Implementing protected routes

## Authentication Flow
```
┌─────────────────────────────────────────────────────────┐
│                    Authentication Flow                   │
└─────────────────────────────────────────────────────────┘

User Login (Next.js Frontend)
    └─> Better Auth handles login
        └─> Issues JWT token
            └─> Stores in httpOnly cookie

API Request (Next.js → FastAPI)
    └─> Frontend extracts JWT from session
        └─> Sends in Authorization: Bearer <token>

Token Verification (FastAPI Middleware)
    └─> Extract token from header
        └─> Verify signature with SECRET_KEY
            └─> Extract user_id from payload
                └─> Attach to request.state.user_id

Data Access (FastAPI Route)
    └─> Filter data by request.state.user_id
        └─> Return only user's data
```

## Frontend Setup (Next.js)

### 1. Install Better Auth
```bash
cd frontend
npm install better-auth
```

### 2. Configure Better Auth
```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { jwt } from "better-auth/plugins";

export const auth = betterAuth({
  // Base URL of your app
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",

  // Database connection (Better Auth manages users table)
  database: {
    provider: "postgresql",
    url: process.env.DATABASE_URL!
  },

  // Email/password authentication
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false  // Set true in production
  },

  // JWT plugin for API authentication
  plugins: [
    jwt({
      secret: process.env.BETTER_AUTH_SECRET!,
      expiresIn: "7d",
      algorithm: "HS256"
    })
  ],

  // Session configuration
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7  // 7 days
    }
  }
});

// Export types
export type Session = typeof auth.$Infer.Session;
```

### 3. Environment Variables (.env.local)
```bash
# Frontend environment
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
BETTER_AUTH_SECRET=your-super-secret-key-min-32-chars-long
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
```

### 4. Auth API Route Handler
```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

### 5. Auth Client (for components)
```typescript
// lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
});

export const { useSession, signIn, signOut, signUp } = authClient;
```

### 6. Login Component
```tsx
// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: "/dashboard"
      });

      if (result.error) {
        setError(result.error.message);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6">Login</h1>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 7. Protected Route Pattern
```tsx
// app/dashboard/layout.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <nav className="bg-gray-800 text-white p-4">
        <div className="flex justify-between items-center">
          <h1>Todo App</h1>
          <div>
            <span className="mr-4">{session.user.email}</span>
            <form action="/api/auth/signout" method="POST">
              <button className="bg-red-600 px-4 py-2 rounded">
                Logout
              </button>
            </form>
          </div>
        </div>
      </nav>
      <main className="p-8">{children}</main>
    </div>
  );
}
```

### 8. API Client with JWT
```typescript
// lib/api.ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthToken() {
  const session = await auth.api.getSession({
    headers: await headers()
  });
  return session?.session.token;  // JWT token
}

export const api = {
  async getTasks() {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}/api/tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    return response.json();
  },

  async createTask(data: { title: string; description?: string }) {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}/api/tasks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to create task: ${response.statusText}`);
    }

    return response.json();
  },

  async updateTask(taskId: number, data: Partial<{ title: string; description?: string; completed: boolean }>) {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to update task: ${response.statusText}`);
    }

    return response.json();
  },

  async deleteTask(taskId: number) {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to delete task: ${response.statusText}`);
    }

    return response.json();
  }
};
```

## Backend Setup (FastAPI)

### 1. Install Dependencies
```bash
cd backend
pip install pyjwt python-dotenv
```

### 2. Environment Variables (.env)
```bash
# Backend environment
BETTER_AUTH_SECRET=your-super-secret-key-min-32-chars-long  # MUST match frontend
DATABASE_URL=postgresql://user:pass@host.neon.tech/db?sslmode=require
```

### 3. JWT Verification Middleware
```python
# app/middleware/auth.py
import jwt
import os
from fastapi import Request, HTTPException
from functools import wraps

SECRET_KEY = os.getenv("BETTER_AUTH_SECRET")

if not SECRET_KEY:
    raise ValueError("BETTER_AUTH_SECRET environment variable not set")

async def verify_jwt_token(request: Request):
    """
    Extract and verify JWT token from Authorization header.
    Attaches user_id to request.state for downstream use.
    """
    # Extract Authorization header
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(
            status_code=401,
            detail="Missing Authorization header"
        )

    # Check Bearer format
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Invalid Authorization header format (expected 'Bearer <token>')"
        )

    # Extract token
    token = auth_header.replace("Bearer ", "")

    try:
        # Verify token signature and decode payload
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=["HS256"]
        )

        # Extract user_id from token payload
        # Better Auth typically uses 'sub' (subject) or 'userId'
        user_id = payload.get("sub") or payload.get("userId")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token: missing user identifier"
            )

        # Attach user_id to request state
        request.state.user_id = user_id

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )

# Dependency for protected routes
from fastapi import Depends

def get_current_user(request: Request) -> str:
    """
    Dependency to get current user ID from request.
    Use in route handlers: user_id: str = Depends(get_current_user)
    """
    if not hasattr(request.state, "user_id"):
        raise HTTPException(
            status_code=401,
            detail="Authentication required"
        )
    return request.state.user_id
```

### 4. Apply Middleware to App
```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from app.middleware.auth import verify_jwt_token

app = FastAPI(title="Todo API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT verification middleware
class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        # Skip auth for public endpoints
        if request.url.path in ["/health", "/docs", "/openapi.json"]:
            return await call_next(request)

        # Verify JWT for protected endpoints
        if request.url.path.startswith("/api/"):
            await verify_jwt_token(request)

        return await call_next(request)

app.add_middleware(AuthMiddleware)
```

### 5. Protected Route Example
```python
# app/routes/tasks.py
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import Task, TaskCreate
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["tasks"])

@router.get("/")
async def list_tasks(
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    List all tasks for authenticated user.
    User ID is extracted from JWT token, not from request.
    """
    statement = select(Task).where(
        Task.user_id == user_id,
        Task.deleted_at.is_(None)  # Only active tasks
    )
    tasks = session.exec(statement).all()

    return {"tasks": tasks, "count": len(tasks)}

@router.post("/")
async def create_task(
    task_data: TaskCreate,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """
    Create new task for authenticated user.
    User ID from JWT token, NOT from request body.
    """
    # Create task with user_id from token
    task = Task(
        **task_data.dict(),
        user_id=user_id  # From JWT, not client input!
    )

    session.add(task)
    session.commit()
    session.refresh(task)

    return task

@router.put("/{task_id}")
async def update_task(
    task_id: int,
    task_data: TaskCreate,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Update task (only if owned by authenticated user)"""
    task = session.get(Task, task_id)

    if not task or task.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Task not found")

    # Verify ownership
    if task.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Cannot modify other user's tasks"
        )

    # Update task
    for key, value in task_data.dict(exclude_unset=True).items():
        setattr(task, key, value)

    session.commit()
    session.refresh(task)

    return task

@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    user_id: str = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Soft delete task (only if owned by authenticated user)"""
    task = session.get(Task, task_id)

    if not task or task.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Task not found")

    # Verify ownership
    if task.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Cannot delete other user's tasks"
        )

    # Soft delete
    from datetime import datetime, timezone
    task.deleted_at = datetime.now(timezone.utc)

    session.commit()

    return {"message": "Task deleted successfully"}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Different secrets in frontend/backend | Use same BETTER_AUTH_SECRET in both |
| Token not sent in header | Always use `Authorization: Bearer <token>` |
| Backend trusts client-provided user_id | Extract user_id from JWT token only |
| Token in request body | Token goes in Authorization header |
| No user ownership verification | Check `task.user_id == current_user_id` |
| Returning other users' data | Always filter by authenticated user_id |

## Security Checklist

- [ ] BETTER_AUTH_SECRET is at least 32 characters
- [ ] Same secret used in frontend and backend
- [ ] HTTPS in production (not HTTP)
- [ ] Tokens expire (7 days max)
- [ ] Backend verifies token signature
- [ ] Backend extracts user_id from token
- [ ] All API routes check user ownership
- [ ] No sensitive data in JWT payload
- [ ] CORS configured correctly

## Usage Instructions

### Set Up Frontend Auth
@.claude/skills/better-auth-integrator/Skill.md
Set up Better Auth in Next.js frontend.
Requirements:

Email/password authentication
JWT plugin for API calls
Protected dashboard routes
Login/signup pages
Session management

Save to: frontend/lib/auth.ts

### Set Up Backend Auth
@.claude/skills/better-auth-integrator/Skill.md
Set up JWT verification middleware in FastAPI.
Requirements:

Verify JWT signature with BETTER_AUTH_SECRET
Extract user_id from token payload
Attach to request.state.user_id
Protect all /api/* routes
Skip auth for /health, /docs

Save to: backend/app/middleware/auth.py
