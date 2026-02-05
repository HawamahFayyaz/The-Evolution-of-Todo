---
id: "0002"
title: "tasks-rest-api-contract"
stage: spec
date: 2026-01-15
surface: cli
model: claude-opus-4-5-20251101
feature: 001-fullstack-web
branch: 001-fullstack-web
user: developer
command: /sp.specify
labels: [api-contract, rest-api, tasks, phase-ii]
links:
  spec: specs/001-fullstack-web/spec.md
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  - path: specs/001-fullstack-web/contracts/tasks-api.md
    action: created
tests:
  - N/A
---

## Prompt

API Specification: Todo REST API - Detailed endpoint definitions including:
- List Tasks (GET /api/tasks)
- Get Task by ID (GET /api/tasks/{id})
- Create Task (POST /api/tasks)
- Update Task (PUT /api/tasks/{id})
- Delete Task (DELETE /api/tasks/{id})
- Toggle Task Completion (PATCH /api/tasks/{id}/complete)

With authentication requirements (JWT Bearer token), error responses (401, 403, 404, 422, 500), request/response schemas, and security considerations.

## Response snapshot

Recognized this as an API contract document rather than a feature specification. Saved to `specs/001-fullstack-web/contracts/tasks-api.md` as a reference document for the existing Phase II feature.

The contract defines:
- 6 RESTful endpoints for task CRUD operations
- Task resource schema with field definitions and constraints
- Query parameters for filtering and sorting
- Standard error responses with status codes
- Security considerations (user ID from JWT, data isolation, soft deletes)

This is a technical implementation document that will guide backend development during the `/sp.plan` phase.

## Outcome

- Impact: API contract documented for backend implementation reference
- Tests: N/A (contract document)
- Files: contracts/tasks-api.md created
- Next prompts: /sp.plan to create implementation plan using this contract
- Reflection: Correctly identified as contract doc vs feature spec

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A (not a spec validation)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
