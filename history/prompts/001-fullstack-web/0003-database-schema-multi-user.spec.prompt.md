---
id: "0003"
title: "database-schema-multi-user"
stage: spec
date: 2026-01-15
surface: cli
model: claude-opus-4-5-20251101
feature: 001-fullstack-web
branch: 001-fullstack-web
user: developer
command: /sp.specify
labels: [data-model, database, postgresql, schema, phase-ii]
links:
  spec: specs/001-fullstack-web/spec.md
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  - path: specs/001-fullstack-web/data-model.md
    action: created
tests:
  - N/A
---

## Prompt

Schema Update: Multi-User Support + PostgreSQL - Database schema specification including:
- users table (managed by Better Auth, reference only)
- tasks table with user_id foreign key, title, description, completed, timestamps
- Indexes for query performance (user_id, completed, created_at)
- Constraints (foreign key, length checks)
- SQLModel implementation reference

## Response snapshot

Recognized this as a data model document rather than a feature specification. Saved to `specs/001-fullstack-web/data-model.md` as a reference document for the existing Phase II feature.

The data model defines:
- Entity relationship diagram (users 1:N tasks)
- users table (reference - managed by Better Auth)
- tasks table with all fields, types, constraints
- 4 indexes for query optimization
- Field validation rules
- Data isolation requirements (critical security)
- Cascade behavior on user deletion
- Migration notes and soft delete extension recommendation

## Outcome

- Impact: Database schema documented for backend implementation
- Tests: N/A (data model document)
- Files: data-model.md created
- Next prompts: /sp.plan to create implementation plan using this schema
- Reflection: Added soft delete recommendation per constitution requirements

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A (not a spec validation)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
