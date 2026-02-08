---
id: "0002"
title: "implement-chat-backend"
stage: green
date: 2026-02-08
surface: claude-code
model: claude-opus-4-6
feature: 006-chat-backend
branch: 006-chat-backend
user: hawamah
command: /sp.implement
labels: [green, phase-iii, chat-backend, openai-agents, implementation]
links:
  spec: specs/features/004-chat-api.md, specs/features/005-mcp-server.md
  ticket: ""
  adr: ""
  pr: ""
files:
  - backend/models.py
  - backend/config.py
  - backend/auth.py
  - backend/rate_limiter.py
  - backend/main.py
  - backend/agent/__init__.py
  - backend/agent/tools.py
  - backend/agent/chat_agent.py
  - backend/routes/chat.py
  - backend/requirements.txt
  - backend/.env.example
  - backend/CLAUDE.md
  - backend/tests/test_chat_models.py
  - backend/tests/test_tools.py
  - backend/tests/test_chat.py
tests:
  - backend/tests/test_chat_models.py
  - backend/tests/test_tools.py
  - backend/tests/test_chat.py
---

## Prompt

/sp.implement — Execute the implementation plan for 006-chat-backend across 4 batches:
BATCH 1: Database Layer (Conversation + Message models)
BATCH 2: MCP Function Tools (5 @function_tool implementations)
BATCH 3: OpenAI Agents SDK (Agent factory + async runner)
BATCH 4: Chat API Endpoints (POST /api/chat, GET /api/conversations/{id}/messages)

## Response snapshot

Implemented full Phase III chat backend in 6 batches:

1. **Database Models**: Added `Conversation` and `Message` SQLModel classes to `models.py` with composite indexes, FK relationships, and soft delete support. Added OpenAI config to `config.py` and `.env.example`.

2. **Function Tools**: Created `backend/agent/tools.py` with 5 `@function_tool` implementations (`add_task`, `list_tasks`, `complete_task`, `delete_task`, `update_task`). Architecture: raw `_impl` functions for testability, `@function_tool` wrappers for agent integration, user_id injected via closure.

3. **Agent Setup**: Created `backend/agent/chat_agent.py` with system prompt, `create_agent()` factory, async `run_agent()` function, `AgentResult` dataclass, and `AIServiceError` exception. Uses OpenAI Agents SDK `Agent` + `Runner.run`.

4. **Chat API**: Created `backend/routes/chat.py` with Pydantic request/response models, conversation helper functions, `POST /api/chat` (stateless flow), `GET /api/conversations/{id}/messages` (history retrieval). Rate limiting: 10/min chat, 30/min history.

5. **Tests**: 40 new tests across 3 files: 6 model tests, 19 tool tests, 15 endpoint tests. All pass with mocked AI.

6. **Polish**: Updated `backend/CLAUDE.md`, fixed pre-existing auth bug (Python 3.14 datetime string handling).

## Outcome

- ✅ Impact: Full chat backend implemented — 13 files created/modified, 74/75 tests passing (1 pre-existing failure)
- 🧪 Tests: 40 new tests (6 model + 19 tool + 15 endpoint), all passing. Mocked AI via `agent.chat_agent.Runner.run` AsyncMock.
- 📁 Files: backend/agent/ package (3 files), backend/routes/chat.py, backend/models.py (2 new models), 3 test files, config updates
- 🔁 Next prompts: Frontend-backend integration testing, rate limit verification, conversation persistence verification
- 🧠 Reflection: Key learnings: (1) `FunctionTool` has no `.fn` attribute — test raw `_impl` functions instead. (2) `asyncio.run()` fails in FastAPI event loop — use `async/await` directly. (3) Python 3.14 + SQLite returns datetime as string — handle both types in auth.py.

## Evaluation notes (flywheel)

- Failure modes observed: (1) FunctionTool API mismatch — no `.fn` attr, solved by extracting _impl functions. (2) asyncio.run inside running loop — switched to async/await. (3) Python 3.14 SQLite datetime regression — added isinstance check for str.
- Graders run and results (PASS/FAIL): pytest 74/75 PASS (1 pre-existing failure in test_tasks.py)
- Prompt variant (if applicable): Multi-batch implementation with context from prior conversation
- Next experiment (smallest change to try): Verify live frontend-backend chat integration with real OpenAI API
