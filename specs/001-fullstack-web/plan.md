# Implementation Plan: Phase II Full-Stack Web Application

**Branch**: `001-fullstack-web` | **Date**: 2026-01-15 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-fullstack-web/spec.md`

## Summary

Transform the Phase I console CLI todo application into a modern full-stack web application with user authentication, RESTful API, PostgreSQL persistence, and multi-user data isolation. The system uses Next.js 16+ App Router for the frontend with Better Auth for authentication, FastAPI for the backend API, SQLModel ORM for database operations, and Neon PostgreSQL for serverless database hosting.

## Technical Context

**Language/Version**: Python 3.13+ (backend), TypeScript/Node 20+ (frontend)
**Primary Dependencies**: FastAPI, SQLModel, Better Auth, Next.js 16+, Tailwind CSS
**Storage**: Neon PostgreSQL (serverless)
**Testing**: pytest (backend), manual testing + future Jest (frontend)
**Target Platform**: Web browsers (responsive), Vercel (frontend), Railway/Render (backend)
**Project Type**: Web application (monorepo with frontend/ and backend/)
**Performance Goals**: <2s task creation, <60s signup, 100 concurrent users
**Constraints**: JWT authentication, user data isolation, soft deletes only
**Scale/Scope**: Multi-user todo application, 6 API endpoints, 5 page routes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Verification |
|-----------|--------|--------------|
| I. User Autonomy | ✅ PASS | Users have full CRUD control over their tasks |
| II. Accessibility First | ✅ PASS | Intuitive UI, helpful error messages, responsive design |
| III. Spec-Driven Development | ✅ PASS | Full spec, contracts, data model before implementation |
| IV. Progressive Enhancement | ✅ PASS | Phase II builds on Phase I foundation |
| V. Cloud-Native Ready | ✅ PASS | Stateless API, external storage, health endpoints planned |
| VI. Quality Over Speed | ✅ PASS | Error handling, edge cases documented, testing required |
| VII. Full-Stack Consistency | ✅ PASS | API contracts define frontend/backend interface |
| VIII. Stateless REST API | ✅ PASS | JWT auth, no server sessions |
| IX. Multi-User Data Isolation | ✅ PASS | user_id from JWT only, all queries filtered |
| X. Monorepo Organization | ✅ PASS | frontend/ and backend/ structure |

**Gate Result**: ✅ ALL GATES PASS - Proceed to Phase 0

## Project Structure

### Documentation (this feature)

```text
specs/001-fullstack-web/
├── spec.md              # Feature specification (complete)
├── plan.md              # This file
├── research.md          # Phase 0 output (to generate)
├── data-model.md        # Database schema (complete)
├── design-system.md     # UI design system (complete)
├── quickstart.md        # Developer setup guide (to generate)
├── contracts/
│   ├── tasks-api.md     # REST API contract (complete)
│   └── auth-flow.md     # Authentication contract (complete)
├── checklists/
│   └── requirements.md  # Requirements checklist (complete)
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
backend/
├── main.py              # FastAPI application entry point
├── config.py            # Configuration and environment variables
├── database.py          # Database connection and session management
├── models.py            # SQLModel schemas (Task)
├── auth.py              # JWT verification middleware
├── routes/
│   └── tasks.py         # Task CRUD API endpoints
├── tests/
│   ├── conftest.py      # pytest fixtures
│   ├── test_tasks.py    # Task API integration tests
│   └── test_auth.py     # Authentication tests
├── requirements.txt     # Python dependencies
├── pyproject.toml       # Project configuration
└── CLAUDE.md            # Backend-specific context

frontend/
├── app/
│   ├── layout.tsx       # Root layout with providers
│   ├── page.tsx         # Landing page (/)
│   ├── (auth)/
│   │   ├── login/page.tsx    # Login page (/login)
│   │   └── signup/page.tsx   # Signup page (/signup)
│   └── dashboard/
│       ├── layout.tsx        # Protected dashboard layout
│       ├── page.tsx          # Dashboard overview (/dashboard)
│       └── tasks/page.tsx    # Task management (/dashboard/tasks)
├── components/
│   ├── ui/              # Reusable UI components (buttons, inputs, cards)
│   ├── task-card.tsx    # Task display component
│   ├── task-form.tsx    # Task creation/edit form
│   └── task-list.tsx    # Task list component
├── lib/
│   ├── auth.ts          # Better Auth client configuration
│   ├── auth-client.ts   # Auth client instance
│   └── api/
│       ├── client.ts    # Fetch wrapper with auth
│       └── tasks.ts     # Task API functions
├── types/
│   └── index.ts         # TypeScript type definitions
├── package.json         # Node dependencies
├── tailwind.config.ts   # Tailwind CSS configuration
├── next.config.ts       # Next.js configuration
└── CLAUDE.md            # Frontend-specific context
```

**Structure Decision**: Web application monorepo with separate frontend/ and backend/ directories per Constitution Principle X.

## Complexity Tracking

> No violations - all implementation follows constitution principles.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| ORM | SQLModel only | Constitution forbids raw SQL |
| Auth | Better Auth + JWT | Constitution specifies this flow |
| Deletes | Soft delete only | Constitution forbids hard deletes |
| User ID | From JWT only | Constitution security requirement |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    NEXT.JS 16+ APP ROUTER                          │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │ │
│  │  │ Landing Page │  │  Auth Pages  │  │    Dashboard (Protected) │ │ │
│  │  │     (/)      │  │ /login       │  │ /dashboard               │ │ │
│  │  │              │  │ /signup      │  │ /dashboard/tasks         │ │ │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘ │ │
│  │                           │                      │                 │ │
│  │                           ▼                      ▼                 │ │
│  │               ┌──────────────────┐    ┌───────────────────┐       │ │
│  │               │   BETTER AUTH    │    │    API CLIENT     │       │ │
│  │               │ (Auth Provider)  │    │  (Fetch + JWT)    │       │ │
│  │               └────────┬─────────┘    └─────────┬─────────┘       │ │
│  └────────────────────────│──────────────────────│───────────────────┘ │
│                           │                       │                     │
│                           │ JWT Cookie            │ Authorization: Bearer
│                           ▼                       ▼                     │
├─────────────────────────────────────────────────────────────────────────┤
│                         VERCEL HOSTING                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FASTAPI BACKEND                                  │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                      JWT VERIFICATION MIDDLEWARE                    │ │
│  │              (Validates token, extracts user_id)                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                         API ROUTES                                  │ │
│  │  GET    /api/tasks           - List user's tasks                   │ │
│  │  GET    /api/tasks/{id}      - Get specific task                   │ │
│  │  POST   /api/tasks           - Create new task                     │ │
│  │  PUT    /api/tasks/{id}      - Update task                         │ │
│  │  DELETE /api/tasks/{id}      - Soft delete task                    │ │
│  │  PATCH  /api/tasks/{id}/complete - Toggle completion               │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                    │                                     │
│                                    ▼                                     │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                        SQLMODEL ORM                                 │ │
│  │              (Task model with user_id filtering)                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                         RAILWAY/RENDER HOSTING                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ PostgreSQL Protocol
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      NEON POSTGRESQL (SERVERLESS)                        │
│  ┌────────────────┐       ┌────────────────────────────────────┐       │
│  │     users      │◄──────│            tasks                    │       │
│  │ (Better Auth)  │  1:N  │ id, user_id, title, description,   │       │
│  │                │       │ completed, created_at, updated_at,  │       │
│  │                │       │ deleted_at                          │       │
│  └────────────────┘       └────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

### JWT Authentication Flow

```
┌───────────┐    1. Signup/Login      ┌───────────────┐
│           │ ────────────────────────▶│               │
│  Browser  │                          │  Better Auth  │
│           │◀────────────────────────│  (Frontend)   │
└───────────┘    2. JWT in Cookie      └───────────────┘
     │                                        │
     │ 3. API Request                         │ Creates/validates
     │    + Authorization: Bearer <token>     │ user in DB
     ▼                                        ▼
┌───────────────────────────┐         ┌───────────────┐
│      FastAPI Backend      │         │    Neon DB    │
│  ┌─────────────────────┐  │         │    (users)    │
│  │ JWT Middleware      │  │         └───────────────┘
│  │ - Verify signature  │  │
│  │ - Extract user_id   │  │
│  │ - Attach to request │  │
│  └─────────────────────┘  │
│            │              │
│  4. Filter │ by user_id   │
│            ▼              │
│  ┌─────────────────────┐  │         ┌───────────────┐
│  │ Task Routes         │◀─┼────────▶│    Neon DB    │
│  │ WHERE user_id = X   │  │         │    (tasks)    │
│  └─────────────────────┘  │         └───────────────┘
└───────────────────────────┘
     │
     │ 5. User-scoped response
     ▼
┌───────────┐
│  Browser  │
└───────────┘
```

---

## Implementation Phases

### Phase 1: Backend Foundation

**Objective**: Set up FastAPI project with database connection

#### 1.1 Project Setup
- Initialize backend/ directory structure
- Create pyproject.toml with dependencies:
  - fastapi[standard]
  - sqlmodel
  - python-jose[cryptography] (JWT verification)
  - python-dotenv
  - psycopg2-binary (PostgreSQL driver)
  - uvicorn
  - pytest
  - httpx (testing)
- Create requirements.txt for deployment
- Create backend/CLAUDE.md with context

#### 1.2 Database Connection
- Create config.py with environment variable loading
- Create database.py with:
  - SQLModel engine creation
  - Session dependency for FastAPI
  - Database URL from environment
- Test connection to Neon PostgreSQL

#### 1.3 SQLModel Task Model
- Create models.py with Task class:
  ```python
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
- Create table on startup

### Phase 2: JWT Authentication Middleware

**Objective**: Verify JWT tokens and extract user_id

#### 2.1 JWT Verification
- Create auth.py with:
  - BETTER_AUTH_SECRET from environment
  - JWT decode function using python-jose
  - Token verification (signature, expiration)
  - User ID extraction from `sub` claim

#### 2.2 Authentication Dependency
- Create FastAPI dependency `get_current_user()`:
  - Extract Bearer token from Authorization header
  - Verify and decode JWT
  - Return user_id string
  - Raise 401 on invalid/missing token

#### 2.3 Protected Route Pattern
- All task routes require `current_user: str = Depends(get_current_user)`
- User ID NEVER from request body

### Phase 3: API Routes Implementation

**Objective**: Implement all 6 REST endpoints per contract

#### 3.1 List Tasks (GET /api/tasks)
- Query parameters: status, sort
- Filter: `user_id == current_user AND deleted_at IS NULL`
- Return JSON array of tasks

#### 3.2 Get Task (GET /api/tasks/{id})
- Path parameter: task ID
- Filter: `id == task_id AND user_id == current_user AND deleted_at IS NULL`
- Return 404 if not found (never reveal other users' tasks)

#### 3.3 Create Task (POST /api/tasks)
- Request body: title (required), description (optional)
- Set user_id from JWT (NEVER from request)
- Return 201 with created task

#### 3.4 Update Task (PUT /api/tasks/{id})
- Request body: title, description (at least one)
- Verify ownership before update
- Update updated_at timestamp
- Return updated task

#### 3.5 Delete Task (DELETE /api/tasks/{id})
- Soft delete: set deleted_at = utcnow()
- Verify ownership before delete
- Return 204 No Content

#### 3.6 Toggle Complete (PATCH /api/tasks/{id}/complete)
- Toggle completed boolean
- Update updated_at timestamp
- Verify ownership
- Return updated task

### Phase 4: Error Handling & CORS

**Objective**: Proper error responses and cross-origin configuration

#### 4.1 Error Handlers
- 401 Unauthorized: missing/invalid token
- 403 Forbidden: task belongs to other user
- 404 Not Found: task doesn't exist
- 422 Validation Error: invalid input
- 500 Internal Error: unexpected failures

#### 4.2 CORS Configuration
- Allow origins: localhost:3000 (dev), production domain
- Allow credentials: true (for cookies)
- Allow methods: GET, POST, PUT, DELETE, PATCH
- Allow headers: Authorization, Content-Type

#### 4.3 Health Endpoints
- GET /health - liveness check
- GET /ready - readiness check (DB connection)

### Phase 5: Frontend Foundation

**Objective**: Set up Next.js project with Tailwind CSS

#### 5.1 Project Setup
- Initialize Next.js 16+ with App Router
- Configure TypeScript strict mode
- Install and configure Tailwind CSS
- Add Heroicons for icons
- Create frontend/CLAUDE.md

#### 5.2 Design System Implementation
- Configure tailwind.config.ts with design system colors
- Add Inter font from Google Fonts
- Create base component styles

#### 5.3 Type Definitions
- Create types/index.ts with Task interface
- Create API response types
- Ensure camelCase for frontend

### Phase 6: Better Auth Configuration

**Objective**: Set up authentication provider

#### 6.1 Better Auth Setup
- Install better-auth package
- Create lib/auth.ts with configuration:
  - Database adapter (Neon PostgreSQL)
  - Email/password provider
  - Session configuration
  - JWT settings

#### 6.2 Auth Client
- Create lib/auth-client.ts
- Export useSession hook
- Export signIn, signUp, signOut functions

#### 6.3 Auth API Route
- Create app/api/auth/[...all]/route.ts
- Connect Better Auth handler

### Phase 7: API Client Layer

**Objective**: Create type-safe API client with auth

#### 7.1 Base Client
- Create lib/api/client.ts:
  - Base URL configuration
  - Automatic JWT token injection
  - Response type handling
  - Error handling

#### 7.2 Tasks API
- Create lib/api/tasks.ts:
  - listTasks(filters?)
  - getTask(id)
  - createTask(data)
  - updateTask(id, data)
  - deleteTask(id)
  - toggleComplete(id)

### Phase 8: Authentication Pages

**Objective**: Build signup and login forms

#### 8.1 Signup Page (/signup)
- Form: email, password, name
- Validation: email format, password min 8 chars
- Submit to Better Auth
- Redirect to dashboard on success
- Show errors on failure

#### 8.2 Login Page (/login)
- Form: email, password
- Submit to Better Auth
- Redirect to dashboard on success
- Show "Invalid credentials" on failure

#### 8.3 Layout
- Centered card design per design-system.md
- Links between login/signup
- Brand logo

### Phase 9: Protected Dashboard

**Objective**: Build authenticated dashboard layout and pages

#### 9.1 Dashboard Layout
- Protected route (redirect if not authenticated)
- Navigation: Dashboard, Tasks, User menu
- Logout functionality

#### 9.2 Dashboard Page (/dashboard)
- Welcome message with user name
- Task statistics (total, completed, pending)
- Recent tasks preview
- Quick add task

#### 9.3 Tasks Page (/dashboard/tasks)
- Full task list with filters (All/Active/Completed)
- Task cards with actions
- Add task modal/form
- Edit task modal/form
- Delete confirmation
- Toggle completion

### Phase 10: UI Components

**Objective**: Build reusable task components

#### 10.1 Task Card Component
- Display: checkbox, title, description, actions
- States: active, completed
- Actions: edit, delete, toggle

#### 10.2 Task Form Component
- Fields: title (required), description (optional)
- Validation with error messages
- Loading state on submit

#### 10.3 Task List Component
- Map tasks to cards
- Empty state message
- Loading skeleton

### Phase 11: Integration & Testing

**Objective**: End-to-end testing of all flows

#### 11.1 Environment Setup
- Backend .env with BETTER_AUTH_SECRET, DATABASE_URL
- Frontend .env.local with same BETTER_AUTH_SECRET, API_URL
- Verify secrets match

#### 11.2 Integration Tests (Backend)
- pytest fixtures for auth tokens
- Test all 6 endpoints
- Test user isolation
- Test error cases

#### 11.3 Manual Testing
- Complete user journey:
  1. Visit landing page
  2. Click signup
  3. Create account
  4. View empty dashboard
  5. Create task
  6. Edit task
  7. Mark complete
  8. Delete task
  9. Logout
  10. Login again
  11. Verify data persisted

---

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require

# Authentication (MUST match frontend)
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app

# Server
HOST=0.0.0.0
PORT=8000
```

### Frontend (.env.local)

```bash
# Public URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Authentication (MUST match backend)
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long

# Database (for Better Auth)
DATABASE_URL=postgresql://user:password@ep-xxx.region.neon.tech/dbname?sslmode=require
```

**CRITICAL**: BETTER_AUTH_SECRET must be identical in both environments.

---

## Deployment Plan

### Database (Neon)
1. Create project at neon.tech
2. Copy connection string
3. Store in both environment configs
4. Tables auto-created on first run

### Backend (Railway/Render)
1. Connect GitHub repository
2. Set root directory: backend/
3. Build command: pip install -r requirements.txt
4. Start command: uvicorn main:app --host 0.0.0.0 --port $PORT
5. Add environment variables
6. Deploy

### Frontend (Vercel)
1. Connect GitHub repository
2. Set root directory: frontend/
3. Framework preset: Next.js
4. Add environment variables
5. Deploy
6. Update backend CORS with Vercel URL

---

## Testing Strategy

### Backend Testing (pytest)

| Test Category | Coverage |
|---------------|----------|
| Authentication | Token validation, missing token, expired token, invalid token |
| List Tasks | Empty list, with tasks, filtered by status |
| Get Task | Found, not found, wrong user (403) |
| Create Task | Valid, missing title, user_id from JWT only |
| Update Task | Valid, not found, wrong user |
| Delete Task | Valid, not found, wrong user, soft delete verified |
| Toggle | Valid, not found, state changes correctly |

### Frontend Testing (Manual → Jest)

| Flow | Steps |
|------|-------|
| Signup | Fill form → Submit → Redirect to dashboard |
| Login | Fill form → Submit → Redirect to dashboard |
| Logout | Click → Redirect to landing |
| Create Task | Click add → Fill form → See in list |
| Edit Task | Click edit → Modify → See changes |
| Delete Task | Click delete → Confirm → Removed from list |
| Toggle | Click checkbox → Status changes |
| Persistence | Logout → Login → Data preserved |

### Security Testing

| Test | Verification |
|------|--------------|
| User Isolation | User A cannot see User B's tasks |
| JWT Required | All /api/tasks routes return 401 without token |
| user_id Source | Sending user_id in body is ignored; JWT used |
| Soft Delete | Deleted tasks exist in DB with deleted_at set |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Secret mismatch | Document in quickstart, verify in integration tests |
| CORS issues | Test locally before deploy, log CORS errors |
| Token expiration | Redirect to login on 401, clear message |
| Database connection | Health check endpoint, connection pooling |
| Performance | Indexes on user_id, pagination for large lists |

---

## Success Criteria Mapping

| Criterion | Implementation |
|-----------|---------------|
| SC-001: 60s signup | Simple form, minimal fields |
| SC-002: 10s signin | Direct Better Auth flow |
| SC-003: 2s task create | Optimistic UI updates |
| SC-004: 100% isolation | All queries filter by user_id |
| SC-005: 0% data loss | PostgreSQL persistence |
| SC-006: 100 users | Stateless API, Neon autoscaling |
| SC-007: 90s demo | Linear flow: signup → tasks → done |
| SC-008: First-try success | Intuitive UI, clear labels |

---

## Next Steps

1. **Run `/sp.tasks`** to generate atomic task breakdown
2. **Implement in order**: Backend → Database → Auth → API → Frontend → UI → Integration
3. **Test continuously**: After each phase, verify against spec requirements
