---
id: "0004"
title: "better-auth-jwt-contract"
stage: spec
date: 2026-01-15
surface: cli
model: claude-opus-4-5-20251101
feature: 001-fullstack-web
branch: 001-fullstack-web
user: developer
command: /sp.specify
labels: [authentication, better-auth, jwt, security, phase-ii]
links:
  spec: specs/001-fullstack-web/spec.md
  ticket: N/A
  adr: N/A
  pr: N/A
files:
  - path: specs/001-fullstack-web/contracts/auth-flow.md
    action: created
tests:
  - N/A
---

## Prompt

Feature: User Authentication with Better Auth + JWT - Implementation guide including:
- Signup, signin, logout flows with diagrams
- JWT token structure and payload claims
- Frontend configuration (Better Auth, API client, protected routes)
- Backend JWT verification middleware
- Security requirements (shared secret, httpOnly cookies, data isolation)
- Environment variables for frontend and backend

## Response snapshot

Recognized this as an authentication contract/implementation guide. Saved to `specs/001-fullstack-web/contracts/auth-flow.md` as a reference document for the existing Phase II feature.

The auth contract defines:
- 4 authentication flows with ASCII diagrams (signup, signin, API request, logout)
- JWT token specification (HS256, 7-day expiry, payload claims)
- Security requirements (shared secret, httpOnly cookies, data isolation)
- Error response codes and messages
- Request/response examples
- Validation rules (password min 8 chars, valid email)
- Session management and cookie configuration

Critical security emphasis: user_id MUST come from verified JWT token, never from request body.

## Outcome

- Impact: Authentication architecture documented for implementation
- Tests: N/A (contract document)
- Files: contracts/auth-flow.md created
- Next prompts: /sp.plan to create implementation plan using all contracts
- Reflection: Emphasized data isolation rule as critical security requirement

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A (not a spec validation)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): N/A
