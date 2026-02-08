# Implementation Plan: Chat Backend (Phase III)

**Branch**: `006-chat-backend` | **Date**: 2026-02-08 | **Spec**: [004-chat-api](../features/004-chat-api.md), [005-mcp-server](../features/005-mcp-server.md), [003-chat-schema](../database/003-chat-schema.md)
**Input**: Feature specifications from `/specs/features/` and `/specs/database/`

## Summary

Implement the Phase III AI-powered chat backend for the todo application. The backend enables natural language task management via a stateless chat API. Each request: loads conversation history from PostgreSQL, processes the user message through an OpenAI Agents SDK agent with 5 function tools (add_task, list_tasks, complete_task, delete_task, update_task), persists the result, and returns the response. No in-memory conversation state is held between requests.

## Technical Context

**Language/Version**: Python 3.13+
**Primary Dependencies**: FastAPI, SQLModel, openai-agents>=0.7.0, slowapi
**Storage**: Neon PostgreSQL (existing, + 2 new tables: conversations, messages)
**Testing**: pytest + pytest-asyncio + httpx (existing setup)
**Target Platform**: Linux server (WSL2 dev, Neon cloud DB)
**Project Type**: Web application (backend only - frontend complete)
**Performance Goals**: p50 <3s, p95 <5s for chat; p50 <200ms for history retrieval
**Constraints**: 30s timeout for LLM calls, max 50 messages per context window, 10 req/min/user rate limit
**Scale/Scope**: Single-user dev/demo, designed for multi-user via user_id isolation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. User Autonomy | PASS | Users control tasks via natural language; all CRUD available |
| II. Accessibility First | PASS | Natural language reduces friction vs. CLI/forms |
| III. Spec-Driven Development | PASS | 3 specs created before this plan |
| IV. Progressive Enhancement | PASS | Chat adds to existing REST API; REST still works |
| V. Cloud-Native Ready | PASS | Stateless, DB-backed, health endpoints exist |
| VI. Quality Over Speed | PASS | Error handling spec'd for all edge cases |
| VII. Full-Stack Consistency | PASS | Frontend types match backend response schema |
| VIII. Stateless REST API | PASS | No server-side session state |
| IX. Multi-User Data Isolation | PASS | user_id from JWT, never request body |
| X. Monorepo Organization | PASS | Backend in `backend/` folder |
| XI. Stateless Chat Architecture | PASS | Agent ephemeral per request, history in DB |
| XII. MCP-First Tool Design | PASS | 5 tools via @function_tool, stateless, structured returns |
| XIII. Natural Language Interface | PASS | OpenAI Agents SDK interprets intent → tools |
| XIV. Conversation Persistence | PASS | All messages stored in `messages` table |

**Post-Design Re-check**:
- SERIAL ids instead of UUID (constitution recommends UUID): ACCEPTED for consistency with existing Task model. Documented in Complexity Tracking.
- `@function_tool` instead of separate MCP server: ACCEPTED as pragmatic choice. Tools satisfy all MCP requirements. Can extract to separate service in Phase IV.

## Project Structure

### Documentation (this feature)

```text
specs/006-chat-backend/
├── plan.md                      # This file
├── research.md                  # Phase 0: Technology decisions
├── data-model.md                # Phase 1: Database models
├── quickstart.md                # Phase 1: Getting started
├── contracts/
│   ├── chat-api.md              # API endpoint contracts
│   └── tool-definitions.md      # Tool input/output contracts
└── tasks.md                     # Phase 2: Task breakdown (sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── main.py              # MODIFY: Register chat_router
├── models.py            # MODIFY: Add Conversation, Message models
├── config.py            # MODIFY: Add OPENAI_API_KEY, OPENAI_MODEL
├── requirements.txt     # MODIFY: Add openai-agents>=0.7.0
├── agent/               # NEW: AI agent module
│   ├── __init__.py
│   ├── tools.py         # 5 @function_tool definitions
│   └── chat_agent.py    # Agent factory + run_agent()
├── routes/
│   ├── tasks.py         # UNCHANGED
│   └── chat.py          # NEW: Chat API endpoints
└── tests/
    ├── test_models.py   # NEW: Conversation/Message model tests
    ├── test_tools.py    # NEW: Tool function tests
    └── test_chat.py     # NEW: Chat endpoint integration tests
```

**Structure Decision**: Web application backend-only. Frontend is 100% complete from Phase III (005-chat-ui). Only backend modifications in `backend/` directory.

## Implementation Phases

### Phase 1: Database Layer (Models)

**Goal**: Add Conversation and Message SQLModel classes to `models.py`.

**Files Modified**:
- `backend/models.py` — Add `Conversation` and `Message` classes with indexes

**Acceptance Criteria**:
- Tables auto-created on server startup via `create_db_and_tables()`
- Models follow existing patterns (partial datetime.now, ClassVar table_args)
- Indexes match spec: user_active composite, conversation_created composite
- No changes to existing Task model

### Phase 2: Configuration

**Goal**: Add OpenAI-related settings to config.

**Files Modified**:
- `backend/config.py` — Add `openai_api_key` and `openai_model` attributes
- `backend/requirements.txt` — Add `openai-agents>=0.7.0`

**Acceptance Criteria**:
- `OPENAI_API_KEY` loaded from environment
- `OPENAI_MODEL` defaults to `gpt-4o-mini`
- Settings validation warns if API key missing (don't crash — allows running without AI)

### Phase 3: Pydantic Schemas

**Goal**: Create request/response models for the chat API.

**Files Modified**:
- `backend/routes/chat.py` — ChatRequest, ChatResponse, ToolCallResponse, MessageResponse

**Acceptance Criteria**:
- `ChatRequest.message` validated: 1-2000 chars, stripped, no whitespace-only
- `ChatRequest.conversation_id` accepts int or string (Pydantic coercion)
- `ChatResponse.tool_calls` is `None` when no tools called (not empty list)
- `MessageResponse` has `from_attributes = True` for SQLModel compatibility

### Phase 4: MCP Function Tools

**Goal**: Implement 5 stateless function tools that wrap task CRUD.

**Files Created**:
- `backend/agent/__init__.py`
- `backend/agent/tools.py` — `create_tools_for_user(user_id, session)` factory

**Acceptance Criteria**:
- All 5 tools: add_task, list_tasks, complete_task, delete_task, update_task
- `user_id` injected via closure (not exposed to AI agent)
- Each tool returns `{success: bool, ...}` dict
- Ownership verification on all mutation tools
- Soft deletes only (delete_task sets deleted_at)
- Tools use same database session as the request
- `add_task` and `update_task` support optional `due_date` parameter (per constitution MCP Tool Requirements)

### Phase 5: Agent Setup

**Goal**: Create agent factory and runner function.

**Files Created**:
- `backend/agent/chat_agent.py` — `create_agent()`, `run_agent()`

**Acceptance Criteria**:
- Agent created with system prompt listing available tools
- `run_agent()` takes message history + user tools, returns response text + tool calls
- 30s timeout on LLM calls
- Graceful error handling (AI timeout → 503, other errors → 500)
- Empty AI response → fallback message "I'm not sure how to help with that."

### Phase 6: Chat API Endpoints

**Goal**: Implement POST /api/chat and GET /api/conversations/{id}/messages.

**Files Created**:
- `backend/routes/chat.py` — Full endpoint implementation

**Files Modified**:
- `backend/main.py` — Register `chat_router`

**Acceptance Criteria**:
- `POST /api/chat`: Full stateless flow (verify → get/create conversation → save user msg → load history from DB (includes just-saved user msg) → pass history to agent (no duplication since user msg is already in loaded history) → run agent → save assistant msg → return)
- `GET /api/conversations/{id}/messages`: Load messages with limit, ownership check
- Rate limiting: 10/min for chat, 30/min for history
- All error responses match existing `create_error_response()` format
- Authentication via `get_current_user` dependency

### Phase 7: Testing

**Goal**: Unit and integration tests for all new components.

**Files Created**:
- `backend/tests/test_models.py` — Model creation, validation, indexes
- `backend/tests/test_tools.py` — All 5 tools: success + error paths
- `backend/tests/test_chat.py` — Endpoint tests with mocked AI agent

**Acceptance Criteria**:
- Models: Create, read, soft delete conversations and messages
- Tools: Each tool tested for success, not-found, unauthorized, validation error
- Chat endpoint: Auth required, create conversation, existing conversation, AI error → 503
- History endpoint: Auth required, ownership check, pagination
- All tests use in-memory SQLite (existing test pattern)
- Mock `Runner.run()` to avoid real OpenAI API calls in tests

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| SERIAL ids (not UUID) — deviates from constitution "Database Standards" which recommends UUID PKs | Consistency with existing Task model (Phase II) which uses SERIAL. Mixing PK types (UUID for chat, SERIAL for tasks) would create confusion and complicate foreign key patterns. | UUID would require migrating Task model or having inconsistent PK types across the same database |
| `@function_tool` decorator (not `from mcp import Tool, Context` class pattern) — deviates from constitution "MCP Tool Pattern" code standard | OpenAI Agents SDK uses `@function_tool` as its native tool registration mechanism. Using a different pattern would require a custom adapter layer. | Class-based MCP Tool pattern would need a bridge to the Agents SDK, adding complexity for no functional benefit |
| Tools in `backend/agent/` (not `backend/tools/`) — deviates from constitution code standard directory convention | Co-locating tools with agent setup (`chat_agent.py`) creates a cohesive module. The `agent/` directory groups all AI-related code: tools + agent factory + runner. | Separate `backend/tools/` directory would split tightly-coupled agent code across two directories |
| Message role "tool" deferred — constitution requires "user", "assistant", "tool" but we implement only "user" and "assistant" | OpenAI Agents SDK handles tool call/result internally within a single agent turn. Tool outputs are captured as part of the assistant response's `tool_calls_json`, not as separate messages. | Storing tool results as separate "tool" role messages would duplicate data already in `tool_calls_json` and add complexity without user-facing benefit |

## Dependencies

| Dependency | Status | Required For |
|------------|--------|-------------|
| Better Auth session verification | COMPLETE (`auth.py`) | Phase 6: Authentication |
| Task model + CRUD patterns | COMPLETE (`models.py`, `routes/tasks.py`) | Phase 4: Tool implementations |
| Database session management | COMPLETE (`database.py`) | All phases |
| Rate limiter | COMPLETE (`rate_limiter.py`) | Phase 6: Rate limiting |
| Structured error responses | COMPLETE (`main.py`) | Phase 6: Error handling |
| Frontend chat UI | COMPLETE (005-chat-ui) | Integration testing |
| OpenAI API key | REQUIRED (env var) | Phase 5: Agent execution |
