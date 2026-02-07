# Tasks: Phase II Full-Stack Web Application

**Input**: Design documents from `/specs/001-fullstack-web/`
**Prerequisites**: plan.md (complete), spec.md (complete), research.md (complete), data-model.md (complete), contracts/ (complete)

**Tests**: Tests are included per constitution requirement for 80%+ test coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Exact file paths included in descriptions

## Path Conventions

- **Backend**: `backend/` (FastAPI, Python)
- **Frontend**: `frontend/` (Next.js, TypeScript)
- **Monorepo Structure**: Per Constitution Principle X

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize monorepo structure with backend and frontend projects

- [x] T001 Create monorepo directory structure with backend/ and frontend/ folders
- [x] T002 [P] Initialize backend Python project with pyproject.toml in backend/pyproject.toml
- [x] T003 [P] Create backend requirements.txt with FastAPI, SQLModel, python-jose, uvicorn in backend/requirements.txt
- [x] T004 [P] Create backend/.env.example with DATABASE_URL, BETTER_AUTH_SECRET placeholders
- [x] T005 [P] Create backend/CLAUDE.md with backend-specific context and patterns
- [x] T006 [P] Initialize Next.js 16+ project with App Router in frontend/
- [x] T007 [P] Configure TypeScript strict mode in frontend/tsconfig.json
- [x] T008 [P] Install and configure Tailwind CSS in frontend/tailwind.config.ts
- [x] T009 [P] Add Heroicons package to frontend dependencies
- [x] T010 [P] Create frontend/.env.local.example with NEXT_PUBLIC_API_URL, BETTER_AUTH_SECRET
- [x] T011 [P] Create frontend/CLAUDE.md with frontend-specific context and patterns
- [x] T012 Configure design system colors (Indigo Dream palette) in frontend/tailwind.config.ts
- [x] T013 Add Inter font from Google Fonts in frontend/app/layout.tsx

**Checkpoint**: Monorepo structure ready, both projects initialize without errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Foundation

- [x] T014 Create configuration module with environment loading in backend/config.py
- [x] T015 Create database connection module with SQLModel engine in backend/database.py
- [x] T016 Create Task SQLModel with all fields per data-model.md in backend/models.py
- [x] T017 Create database session dependency for FastAPI in backend/database.py
- [x] T018 Create FastAPI application entry point with lifespan handler in backend/main.py
- [x] T019 Add CORS middleware configuration in backend/main.py
- [x] T020 [P] Create health check endpoint GET /health in backend/main.py
- [x] T021 [P] Create readiness endpoint GET /ready with DB check in backend/main.py

### Frontend Foundation

- [x] T022 Create TypeScript type definitions for Task in frontend/types/index.ts
- [x] T023 Create API response and error types in frontend/types/index.ts
- [x] T024 Create base API client with fetch wrapper in frontend/lib/api/client.ts
- [x] T025 Create root layout with providers and Inter font in frontend/app/layout.tsx
- [x] T026 [P] Create reusable Button component in frontend/components/ui/button.tsx
- [x] T027 [P] Create reusable Input component in frontend/components/ui/input.tsx
- [x] T028 [P] Create reusable Card component in frontend/components/ui/card.tsx

### Test Infrastructure

- [x] T029 [P] Create pytest configuration in backend/pyproject.toml
- [x] T030 [P] Create test fixtures with mock database session in backend/tests/conftest.py
- [x] T031 [P] Create test fixture for generating JWT tokens in backend/tests/conftest.py

**Checkpoint**: Foundation ready - both servers start, health endpoints respond, UI components render

---

## Phase 3: User Story 1 - User Registration and Authentication (Priority: P1) 🎯 MVP

**Goal**: Users can create accounts, sign in, and sign out securely

**Independent Test**: Create account → Sign out → Sign in → Verify user is recognized

### Backend Authentication (US1)

- [x] T032 [US1] Create JWT verification module with python-jose in backend/auth.py
- [x] T033 [US1] Implement get_current_user dependency extracting user_id from JWT in backend/auth.py
- [x] T034 [US1] Add 401 error response for missing/invalid tokens in backend/auth.py
- [x] T035 [US1] Create auth test fixtures with valid/invalid tokens in backend/tests/conftest.py

### Backend Auth Tests (US1)

- [x] T036 [P] [US1] Test valid JWT token verification in backend/tests/test_auth.py
- [x] T037 [P] [US1] Test invalid JWT signature rejection in backend/tests/test_auth.py
- [x] T038 [P] [US1] Test expired JWT token rejection in backend/tests/test_auth.py
- [x] T039 [P] [US1] Test missing Authorization header returns 401 in backend/tests/test_auth.py

### Frontend Better Auth Setup (US1)

- [x] T040 [US1] Install better-auth package in frontend
- [x] T041 [US1] Create Better Auth server configuration in frontend/lib/auth.ts
- [x] T042 [US1] Create Better Auth client with hooks in frontend/lib/auth-client.ts
- [x] T043 [US1] Create auth API route handler in frontend/app/api/auth/[...all]/route.ts
- [x] T044 [US1] Add token extraction utility for API calls in frontend/lib/api/client.ts

### Frontend Auth Pages (US1)

- [x] T045 [US1] Create landing page with Sign Up / Sign In links in frontend/app/page.tsx
- [x] T046 [US1] Create auth layout with centered card design in frontend/app/(auth)/layout.tsx
- [x] T047 [US1] Create signup page with email/password/name form in frontend/app/(auth)/signup/page.tsx
- [x] T048 [US1] Add form validation (email format, password min 8 chars) to signup page
- [x] T049 [US1] Create login page with email/password form in frontend/app/(auth)/login/page.tsx
- [x] T050 [US1] Add error display for invalid credentials on login page
- [x] T051 [US1] Implement redirect to dashboard on successful auth
- [x] T052 [US1] Add sign out functionality with redirect to landing page

**Checkpoint**: User Story 1 complete - Can signup, login, logout. Ready for MVP demo.

---

## Phase 4: User Story 2 - Task Management CRUD Operations (Priority: P2)

**Goal**: Authenticated users can create, view, edit, and delete tasks

**Independent Test**: Create task → View in list → Edit details → Mark complete → Delete (soft)

### Backend Task API (US2)

- [x] T053 [US2] Create task router with /api/tasks prefix in backend/routes/tasks.py
- [x] T054 [US2] Implement GET /api/tasks endpoint with user_id filter in backend/routes/tasks.py
- [x] T055 [US2] Add query parameters (status, sort) to list tasks endpoint
- [x] T056 [US2] Implement GET /api/tasks/{id} with ownership check in backend/routes/tasks.py
- [x] T057 [US2] Implement POST /api/tasks with user_id from JWT only in backend/routes/tasks.py
- [x] T058 [US2] Implement PUT /api/tasks/{id} with ownership verification in backend/routes/tasks.py
- [x] T059 [US2] Implement DELETE /api/tasks/{id} with soft delete (set deleted_at) in backend/routes/tasks.py
- [x] T060 [US2] Implement PATCH /api/tasks/{id}/complete toggle in backend/routes/tasks.py
- [x] T061 [US2] Add Pydantic schemas for request/response validation in backend/routes/tasks.py
- [x] T062 [US2] Register task router in FastAPI app in backend/main.py

### Backend Task API Tests (US2)

- [x] T063 [P] [US2] Test GET /api/tasks returns user's tasks only in backend/tests/test_tasks.py
- [x] T064 [P] [US2] Test GET /api/tasks returns empty array for new user in backend/tests/test_tasks.py
- [x] T065 [P] [US2] Test GET /api/tasks/{id} returns 404 for other user's task in backend/tests/test_tasks.py
- [x] T066 [P] [US2] Test POST /api/tasks creates task with user_id from JWT in backend/tests/test_tasks.py
- [x] T067 [P] [US2] Test POST /api/tasks ignores user_id in request body in backend/tests/test_tasks.py
- [x] T068 [P] [US2] Test POST /api/tasks validates title required in backend/tests/test_tasks.py
- [x] T069 [P] [US2] Test PUT /api/tasks/{id} updates only owned task in backend/tests/test_tasks.py
- [x] T070 [P] [US2] Test DELETE /api/tasks/{id} sets deleted_at in backend/tests/test_tasks.py
- [x] T071 [P] [US2] Test PATCH /api/tasks/{id}/complete toggles status in backend/tests/test_tasks.py

### Frontend Task API Client (US2)

- [x] T072 [US2] Create tasks API module with all CRUD functions in frontend/lib/api/tasks.ts
- [x] T073 [US2] Add automatic Authorization header injection in frontend/lib/api/client.ts
- [x] T074 [US2] Add error handling for 401/403/404 responses in frontend/lib/api/client.ts

### Frontend Task Components (US2)

- [x] T075 [P] [US2] Create TaskCard component with checkbox, title, actions in frontend/components/task-card.tsx
- [x] T076 [P] [US2] Create completed task styling (opacity, strikethrough) in frontend/components/task-card.tsx
- [x] T077 [P] [US2] Create TaskForm component for create/edit in frontend/components/task-form.tsx
- [x] T078 [P] [US2] Add form validation (title required, max 200 chars) in frontend/components/task-form.tsx
- [x] T079 [P] [US2] Create TaskList component with empty state message in frontend/components/task-list.tsx
- [x] T080 [P] [US2] Create loading skeleton for task list in frontend/components/task-list.tsx

### Frontend Dashboard Pages (US2)

- [x] T081 [US2] Create protected dashboard layout with auth check in frontend/app/dashboard/layout.tsx
- [x] T082 [US2] Add navigation (Dashboard, Tasks, User menu) to dashboard layout
- [x] T083 [US2] Create dashboard overview page with task stats in frontend/app/dashboard/page.tsx
- [x] T084 [US2] Display welcome message with user name on dashboard
- [x] T085 [US2] Create tasks page with full task list in frontend/app/dashboard/tasks/page.tsx
- [x] T086 [US2] Add filter tabs (All/Active/Completed) to tasks page
- [x] T087 [US2] Implement add task modal/form on tasks page
- [x] T088 [US2] Implement edit task modal/form on tasks page
- [x] T089 [US2] Implement delete confirmation dialog on tasks page
- [x] T090 [US2] Implement toggle completion via checkbox click

**Checkpoint**: User Story 2 complete - Full task CRUD works. Can demo complete task management flow.

---

## Phase 5: User Story 3 - Data Persistence Across Sessions (Priority: P3)

**Goal**: Tasks persist through browser close, server restart, and session changes

**Independent Test**: Create tasks → Close browser → Reopen → Sign in → Verify all tasks present

### Backend Persistence Verification (US3)

- [x] T091 [P] [US3] Test task data persists after database session commit in backend/tests/test_tasks.py
- [x] T092 [P] [US3] Test soft-deleted tasks excluded from list but exist in DB in backend/tests/test_tasks.py
- [x] T093 [P] [US3] Test timestamps (created_at, updated_at) are correctly set in backend/tests/test_tasks.py

### Frontend Session Handling (US3)

- [x] T094 [US3] Implement session persistence with httpOnly cookies in frontend/lib/auth.ts
- [x] T095 [US3] Add automatic token refresh on session restore in frontend/lib/auth-client.ts
- [x] T096 [US3] Handle expired session redirect to login with message
- [x] T097 [US3] Refetch tasks on dashboard mount to ensure fresh data

**Checkpoint**: User Story 3 complete - Data survives browser close and server restart.

---

## Phase 6: User Story 4 - Multi-User Data Isolation (Priority: P4)

**Goal**: Complete privacy - no user can access another user's data

**Independent Test**: Create User A tasks → Create User B tasks → Verify complete isolation

### Backend Isolation Tests (US4)

- [x] T098 [P] [US4] Test User A cannot list User B's tasks in backend/tests/test_tasks.py
- [x] T099 [P] [US4] Test User A cannot GET User B's task by ID in backend/tests/test_tasks.py
- [x] T100 [P] [US4] Test User A cannot UPDATE User B's task in backend/tests/test_tasks.py
- [x] T101 [P] [US4] Test User A cannot DELETE User B's task in backend/tests/test_tasks.py
- [x] T102 [P] [US4] Test forged user_id in request body is ignored in backend/tests/test_tasks.py

### Backend Security Hardening (US4)

- [x] T103 [US4] Add explicit user_id filter to ALL task queries in backend/routes/tasks.py
- [x] T104 [US4] Ensure 404 (not 403) returned for other user's tasks to prevent enumeration
- [x] T105 [US4] Add security logging for cross-user access attempts in backend/routes/tasks.py

### Frontend Isolation Verification (US4)

- [x] T106 [US4] Handle 404 errors gracefully when accessing non-existent/unauthorized tasks
- [x] T107 [US4] Clear all cached task data on logout to prevent data leakage

**Checkpoint**: User Story 4 complete - Multi-user security verified. Production-ready isolation.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting all user stories

### Error Handling

- [x] T108 [P] Add structured error responses with codes in backend/main.py
- [x] T109 [P] Create error boundary component in frontend/components/error-boundary.tsx
- [x] T110 [P] Add toast notifications for success/error feedback in frontend/

### Documentation & DevX

- [x] T111 [P] Update backend/CLAUDE.md with final API patterns and examples
- [x] T112 [P] Update frontend/CLAUDE.md with component patterns and state management
- [x] T113 [P] Verify OpenAPI documentation auto-generated at /docs
- [x] T114 Run quickstart.md validation - test full setup from scratch

### Final Testing

- [x] T115 Run full backend test suite with pytest
- [x] T116 Execute manual testing checklist from plan.md
- [x] T117 Verify all success criteria (SC-001 through SC-008)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup ──────────────────────────────────────────┐
                                                          │
Phase 2: Foundational ───────────────────────────────────┤ BLOCKS ALL
                                                          │
    ┌─────────────────────────────────────────────────────┘
    │
    ├──▶ Phase 3: US1 - Authentication (P1) 🎯 MVP
    │         │
    │         ▼ (US2 depends on auth working)
    │
    ├──▶ Phase 4: US2 - Task CRUD (P2)
    │         │
    │         ▼ (US3 builds on CRUD)
    │
    ├──▶ Phase 5: US3 - Persistence (P3)
    │
    └──▶ Phase 6: US4 - Data Isolation (P4)
              │
              ▼
         Phase 7: Polish
```

### User Story Dependencies

| User Story | Depends On | Can Start After |
|------------|------------|-----------------|
| US1 (P1) | Phase 2 | Foundation complete |
| US2 (P2) | US1 | Auth endpoints working |
| US3 (P3) | US2 | CRUD operations working |
| US4 (P4) | US2 | Multiple users can create tasks |

### Within Each User Story

1. Backend implementation first (API endpoints)
2. Backend tests verify API behavior
3. Frontend API client integration
4. Frontend UI components and pages
5. End-to-end verification

### Parallel Opportunities

**Phase 1 - All parallel:**
- T002-T013 can all run in parallel (different files)

**Phase 2 - Grouped:**
- Backend tasks T014-T021 sequential
- Frontend tasks T022-T028 parallel (different files)
- Test infra T029-T031 parallel

**Phase 3 (US1):**
- Backend tests T036-T039 parallel
- Frontend auth pages can be parallelized

**Phase 4 (US2):**
- Backend tests T063-T071 parallel
- Frontend components T075-T080 parallel

**Phase 6 (US4):**
- All isolation tests T098-T102 parallel

---

## Parallel Example: User Story 2 Components

```bash
# Launch all backend API tests together:
Task: "Test GET /api/tasks returns user's tasks only"
Task: "Test GET /api/tasks returns empty array for new user"
Task: "Test POST /api/tasks creates task with user_id from JWT"
Task: "Test POST /api/tasks ignores user_id in request body"
Task: "Test DELETE /api/tasks/{id} sets deleted_at"

# Launch all frontend components together:
Task: "Create TaskCard component in frontend/components/task-card.tsx"
Task: "Create TaskForm component in frontend/components/task-form.tsx"
Task: "Create TaskList component in frontend/components/task-list.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Authentication)
4. **STOP and VALIDATE**: Can users sign up, login, logout?
5. Deploy MVP if auth is working

### Incremental Delivery

1. Setup + Foundation → Servers running
2. **Add US1** → Auth works → **Demo: "Users can sign up!"**
3. **Add US2** → CRUD works → **Demo: "Full task management!"**
4. **Add US3** → Persistence → **Demo: "Data never lost!"**
5. **Add US4** → Isolation → **Demo: "Secure multi-user!"**
6. Polish → Production ready

### Time-Boxed MVP

If time is limited:
1. Complete Phases 1-4 (US1 + US2 only)
2. Skip US3/US4 tests (persistence/isolation work by design)
3. Demo: Full authentication + task CRUD = working application

---

## Task Summary

| Phase | Tasks | Parallel |
|-------|-------|----------|
| Phase 1: Setup | 13 | 11 |
| Phase 2: Foundation | 18 | 8 |
| Phase 3: US1 Auth | 21 | 4 |
| Phase 4: US2 CRUD | 38 | 15 |
| Phase 5: US3 Persist | 7 | 3 |
| Phase 6: US4 Isolation | 10 | 6 |
| Phase 7: Polish | 10 | 5 |
| **TOTAL** | **117** | **52 (44%)** |

---

## Notes

- [P] tasks = different files, no dependencies
- [US#] label maps task to specific user story for traceability
- Backend-first for each feature ensures API is ready when frontend needs it
- Commit after each task or logical group
- Constitution requires: soft deletes, user_id from JWT only, 80%+ test coverage
- Stop at any checkpoint to validate story independently
