---
id: "0002"
title: "phase-ii-constitution-update"
stage: constitution
date: 2026-01-15
surface: cli
model: claude-opus-4-5-20251101
feature: none
branch: main
user: developer
command: /sp.constitution
labels: [phase-ii, constitution, governance]
links:
  spec: N/A
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  - path: .specify/memory/constitution.md
    action: updated
tests:
  - N/A
---

## Prompt

Update the project constitution for Phase II.

Add Phase II context to existing constitution:

Phase II Additions:

New Technologies Allowed:
- Next.js 16+ (App Router)
- FastAPI (Python backend)
- SQLModel (ORM)
- Neon Serverless PostgreSQL
- Better Auth (authentication)
- Vercel (frontend deployment)

Phase II Principles:

1. Full-Stack Consistency
Frontend TypeScript types must match backend SQLModel schemas. Use consistent naming (handle snake_case vs camelCase conversion explicitly).

2. Stateless REST API
All API endpoints must be stateless. Authentication via JWT tokens only. No server-side sessions.

3. Multi-User Support
All data must be scoped to user_id. One user cannot see another user's data. JWT token provides user_id, NOT request body.

4. Monorepo Organization
Frontend and backend in same repo but separate folders. Shared types via OpenAPI/generated clients.

Phase II Technical Constraints:

Project Structure:
```
hackathon-todo/
├── frontend/              # Next.js app
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── CLAUDE.md
├── backend/               # FastAPI app
│   ├── main.py
│   ├── models.py
│   ├── routes/
│   └── CLAUDE.md
├── specs/
├── CLAUDE.md
└── README.md
```

API Standards:
- All routes under /api/
- RESTful naming (GET /api/tasks, POST /api/tasks)
- JWT in Authorization: Bearer <token> header
- Consistent error responses (401, 403, 404, 500)
- All responses JSON format

Database Standards:
- Use SQLModel for all models
- All tables have: id, created_at, updated_at
- Foreign keys indexed
- user_id required on user-scoped tables

Authentication Flow:
1. User logs in via Better Auth (Next.js)
2. Better Auth issues JWT token
3. Frontend stores in httpOnly cookie
4. Frontend sends in Authorization header
5. Backend verifies JWT signature
6. Backend extracts user_id from token
7. Backend filters all queries by user_id

Security Requirements:
- JWT secret shared between frontend/backend
- No passwords in environment variables visible to client
- CORS configured correctly
- Input validation on all endpoints
- SQL injection prevention (SQLModel handles this)

Code Standards (Phase II Additions):
- TypeScript strict mode enabled
- API client pattern for all backend calls
- Server components default, client only when needed
- Environment variables via .env.local

## Response snapshot

Successfully updated constitution from v1.0.0 to v1.1.0 (MINOR version bump).

Changes made:
- Added 4 new Phase II Principles (VII-X): Full-Stack Consistency, Stateless REST API, Multi-User Data Isolation, Monorepo Organization
- Added API Standards section with RESTful conventions
- Added Database Standards section with required fields (id, created_at, updated_at, deleted_at, user_id)
- Added Authentication Flow section with 7-step JWT flow
- Added Security Requirements section
- Added API Client Pattern to Code Standards
- Updated Phase II Quality Gates with new checklist items
- Marked Phase I as COMPLETED
- Marked Phase II as CURRENT

All dependent templates verified compatible:
- plan-template.md: Constitution Check section exists
- spec-template.md: Requirements section aligns
- tasks-template.md: Phase structure supports user stories

## Outcome

- Impact: Constitution now provides complete guidance for Phase II full-stack development
- Tests: N/A (governance document)
- Files: .specify/memory/constitution.md (updated)
- Next prompts: Create Phase II feature specs using /sp.specify
- Reflection: Version bump correctly identified as MINOR (new sections added, no breaking changes)

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Manual review PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
