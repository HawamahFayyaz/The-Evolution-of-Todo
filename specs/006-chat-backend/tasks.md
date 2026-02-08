# Tasks: 006-chat-backend (Phase III Chat Backend)

**Input**: Design documents from `/specs/006-chat-backend/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/chat-api.md, contracts/tool-definitions.md, quickstart.md

**Tests**: Included — plan.md Phase 7 explicitly requires unit and integration tests.

**Organization**: Tasks are grouped by functional component (derived from plan.md implementation phases) to enable incremental implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which component this task belongs to (US1=Database, US2=Tools, US3=Agent, US4=API, US5=Tests)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/` at repository root
- All paths relative to repository root

---

## Phase 1: Setup (Dependencies & Configuration)

**Purpose**: Install new dependency and configure environment variables

- [ ] T001 Add `openai-agents>=0.7.0` to `backend/requirements.txt`
- [ ] T002 Install new dependency: `uv pip install --python .venv/bin/python openai-agents>=0.7.0`
- [ ] T003 [P] Add `openai_api_key` and `openai_model` settings to `backend/config.py` — load `OPENAI_API_KEY` from env (required), `OPENAI_MODEL` with default `gpt-4o-mini`
- [ ] T004 [P] Add `OPENAI_API_KEY` and `OPENAI_MODEL` to `backend/.env.example`

---

## Phase 2: Foundational — Database Models

**Purpose**: Add Conversation and Message SQLModel classes — MUST complete before tools or API

**⚠️ CRITICAL**: No tool, agent, or API work can begin until models are in place

- [ ] T005 [P] Add `Conversation` model to `backend/models.py` — SERIAL PK, user_id VARCHAR(255) indexed, created_at/updated_at with `partial(datetime.now, UTC)`, deleted_at nullable indexed, composite index `ix_conversations_user_active` on (user_id, deleted_at, updated_at) via `ClassVar[tuple]` `__table_args__`
- [ ] T006 [P] Add `Message` model to `backend/models.py` — SERIAL PK, conversation_id FK to conversations.id indexed, user_id VARCHAR(255) indexed, role VARCHAR(50), content TEXT, tool_calls_json TEXT nullable, created_at with `partial(datetime.now, UTC)`, composite index `ix_messages_conversation_created` on (conversation_id, created_at)
- [ ] T007 [P] Add Pydantic request/response models to `backend/routes/chat.py` — `ChatRequest` (conversation_id: int|None, message: str 1-2000 chars), `ToolCallResponse` (tool: str, args: dict, result: dict), `ChatResponse` (conversation_id: int, response: str, tool_calls: list[ToolCallResponse]|None), `MessageResponse` (id: int, role: str, content: str, tool_calls: list[ToolCallResponse]|None, created_at: datetime, model_config from_attributes=True)
- [ ] T008 Verify tables auto-create on startup — restart backend server and confirm `conversations` and `messages` tables exist (existing `create_db_and_tables()` in `backend/main.py` handles this automatically since models are imported)

**Checkpoint**: Database models ready — tool and agent implementation can begin

---

## Phase 3: User Story 1 — MCP Function Tools (Priority: P1) 🎯 MVP

**Goal**: Implement 5 stateless `@function_tool` functions wrapping existing task CRUD, with user_id injection via closure

**Independent Test**: Each tool can be called directly with a user_id and session, returning structured `{success: bool, ...}` dicts

### Implementation for User Story 1

- [ ] T009 [US1] Create `backend/agent/__init__.py` — empty init file for agent package
- [ ] T010 [US1] Create `backend/agent/tools.py` with `create_tools_for_user(user_id: str, session: Session)` factory function scaffold — returns list of 5 tool functions with user_id bound via closure
- [ ] T011 [US1] Implement `add_task` tool in `backend/agent/tools.py` — `@function_tool` decorated, params: title (str), description (str=""), due_date (str|None=None). Creates Task with user_id from closure, returns `{success, task_id, title, description, status: "pending", message}`
- [ ] T012 [US1] Implement `list_tasks` tool in `backend/agent/tools.py` — `@function_tool` decorated, params: status (str="all", enum: all/pending/completed). Queries tasks WHERE user_id=closure AND deleted_at IS NULL, filters by completed flag, returns `{success, tasks: [{task_id, title, description, completed, priority, created_at}], count, message}`
- [ ] T013 [US1] Implement `complete_task` tool in `backend/agent/tools.py` — `@function_tool` decorated, params: task_id (int). Verifies ownership (user_id from closure), handles already-completed case, sets completed=True + updated_at, returns `{success, task_id, title, status: "completed", completed_at, message}`
- [ ] T014 [US1] Implement `delete_task` tool in `backend/agent/tools.py` — `@function_tool` decorated, params: task_id (int). Verifies ownership, soft deletes (deleted_at + updated_at), returns `{success, task_id, title, message}`. Ownership fail returns `{success: false, error: "Task not found", error_code: "TASK_NOT_FOUND"}` (prevents enumeration)
- [ ] T015 [US1] Implement `update_task` tool in `backend/agent/tools.py` — `@function_tool` decorated, params: task_id (int), title (str|None=None), description (str|None=None), due_date (str|None=None). Validates at least one field provided, verifies ownership, updates fields + updated_at, returns `{success, task_id, title, description, updated_at, message}`

**Checkpoint**: All 5 tools callable as standalone functions. Each is stateless, uses DB session from closure, returns structured dicts.

---

## Phase 4: User Story 2 — Agent Setup (Priority: P1)

**Goal**: Create agent factory and runner that wires tools + system prompt + LLM

**Independent Test**: `run_agent()` can be called with a mock history and tools list, returning response text + tool_calls list

### Implementation for User Story 2

- [ ] T016 [US2] Create `backend/agent/chat_agent.py` with system prompt constant — define SYSTEM_PROMPT string listing all 5 tools, their purposes, natural language trigger examples, response style guidelines (friendly confirmations, ask for clarification when ambiguous)
- [ ] T017 [US2] Implement `create_agent(tools: list, model: str)` function in `backend/agent/chat_agent.py` — creates `Agent(name="TodoAssistant", instructions=SYSTEM_PROMPT, tools=tools, model=model)`, uses model from config settings
- [ ] T018 [US2] Implement `run_agent(agent, messages: list[dict], timeout: int = 30)` function in `backend/agent/chat_agent.py` — calls `Runner.run(agent, input=messages)`, extracts `result.final_output` as response text, extracts tool calls from result, returns `AgentResult(response: str, tool_calls: list[dict]|None)`. Handles timeout (raises custom `AIServiceError`), handles empty response (returns fallback "I'm not sure how to help with that.")
- [ ] T019 [US2] Define `AgentResult` dataclass and `AIServiceError` exception in `backend/agent/chat_agent.py` — `AgentResult(response: str, tool_calls: list[dict]|None)`, `AIServiceError(Exception)` for 503 responses
- [ ] T020 [US2] Export public API from `backend/agent/__init__.py` — export `create_tools_for_user`, `create_agent`, `run_agent`, `AgentResult`, `AIServiceError`

**Checkpoint**: Agent can be created with tools and run with message history. Error paths (timeout, empty response) handled.

---

## Phase 5: User Story 3 — Chat API Endpoints (Priority: P1)

**Goal**: Implement POST /api/chat and GET /api/conversations/{id}/messages with full stateless flow

**Independent Test**: `curl POST /api/chat -d '{"message": "Show my tasks"}'` returns AI response with tool_calls; `curl GET /api/conversations/1/messages` returns message history

### Implementation for User Story 3

- [ ] T021 [US3] Add conversation helper functions to `backend/routes/chat.py` — `create_conversation(user_id, session) -> Conversation`, `get_conversation(conversation_id, user_id, session) -> Conversation|None` (filters by user_id AND deleted_at IS NULL), `save_message(conversation_id, user_id, role, content, session, tool_calls=None) -> Message` (json.dumps tool_calls if not None), `load_messages(conversation_id, session, limit=50) -> list[Message]` (ordered by created_at ASC)
- [ ] T022 [US3] Implement `POST /api/chat` endpoint in `backend/routes/chat.py` — full stateless flow: auth via `get_current_user`, validate ChatRequest, get_or_create conversation, save user message, load history (includes just-saved message), create tools for user, create agent, run agent, save assistant response with tool_calls_json, update conversation.updated_at, return ChatResponse. Rate limit: 10/min/user via `@limiter.limit`
- [ ] T023 [US3] Add error handling to `POST /api/chat` in `backend/routes/chat.py` — catch `AIServiceError` → 503 with `AI_SERVICE_UNAVAILABLE` code, catch conversation not found → 404, catch validation errors → 422 (handled by FastAPI), catch generic exceptions → 500. Log AI errors with `logging.exception()`. All errors use existing `HTTPException` with dict detail format matching `main.py` pattern
- [ ] T024 [US3] Implement `GET /api/conversations/{conversation_id}/messages` endpoint in `backend/routes/chat.py` — auth via `get_current_user`, validate conversation ownership (return 404 if not owned — prevents enumeration), query param `limit` (int, 1-100, default 50), load messages ordered by created_at ASC, parse `tool_calls_json` (json.loads or None), return list[MessageResponse]. Rate limit: 30/min/user
- [ ] T025 [US3] Create chat router and register in `backend/main.py` — define `router = APIRouter(tags=["chat"])` in `routes/chat.py`, import and register `app.include_router(chat_router)` in `main.py` alongside existing `tasks_router`
- [ ] T026 [US3] Add `RATE_LIMITS` entries for chat endpoints in `backend/rate_limiter.py` — add `"chat_send": "10/minute"` and `"chat_history": "30/minute"` to existing RATE_LIMITS dict

**Checkpoint**: Both endpoints fully functional. POST /api/chat creates conversations, processes messages through AI agent, persists results. GET endpoint returns paginated message history with ownership checks.

---

## Phase 6: User Story 4 — Testing (Priority: P2)

**Goal**: Unit and integration tests for models, tools, and endpoints

**Independent Test**: `cd backend && pytest tests/test_chat_models.py tests/test_tools.py tests/test_chat.py -v` all pass

### Implementation for User Story 4

- [ ] T027 [P] [US4] Create `backend/tests/test_chat_models.py` — test Conversation creation with user_id/timestamps, test Message creation with all fields, test soft delete (set deleted_at), test tool_calls_json serialization (None for no tools, json.dumps for tools, json.loads round-trip), test Message-Conversation FK relationship. Use in-memory SQLite via existing test fixtures
- [ ] T028 [P] [US4] Create `backend/tests/test_tools.py` — test each of 5 tools: add_task (success + returns task_id), list_tasks (empty + with data + status filter), complete_task (success + already completed + not found + wrong owner), delete_task (success + not found + wrong owner returns "Task not found"), update_task (success + no fields → validation error + not found). Use in-memory SQLite, create Task fixtures directly. Each tool needs real DB session — test via `create_tools_for_user()` factory
- [ ] T029 [P] [US4] Create `backend/tests/test_chat.py` — integration tests via `httpx.AsyncClient` with `app`: test POST /api/chat without auth → 401, test POST /api/chat with empty message → 422, test POST /api/chat creates new conversation (mock `Runner.run`), test POST /api/chat with existing conversation_id, test POST /api/chat when AI times out → 503, test GET /messages without auth → 401, test GET /messages for non-existent conversation → 404, test GET /messages for other user's conversation → 404, test GET /messages with limit param. Mock `Runner.run()` to avoid real OpenAI API calls — return mock `RunResult` with `final_output` and tool call data
- [ ] T030 [US4] Add mock fixtures in `backend/tests/conftest.py` — add pytest fixture for mocking `Runner.run()` (patch `agents.Runner.run`), add fixture for creating test conversations and messages, reuse existing auth mock patterns from `test_tasks.py`

**Checkpoint**: All tests pass. Models validated, tools tested with real DB, endpoints tested with mocked AI agent.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration verification and documentation

- [ ] T031 Verify frontend-backend integration — start backend with `cd backend && uvicorn main:app --reload`, open frontend, send a chat message through the floating chat widget, verify AI response appears with tool call badges
- [ ] T032 [P] Verify rate limiting works — send >10 chat messages within 1 minute, confirm 429 response returned
- [ ] T033 [P] Verify conversation persistence — send messages, restart backend server, load conversation history via GET endpoint, confirm all messages preserved
- [ ] T034 Run full backend test suite — `cd backend && pytest -v` to confirm no regressions in existing task tests
- [ ] T035 Update `backend/CLAUDE.md` with Phase III context — add chat route, agent module, new models, new environment variables, new test files to project structure documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on T001-T002 (dependency installed) — BLOCKS all subsequent phases
- **US1 Tools (Phase 3)**: Depends on T005-T006 (models exist) and T003 (config for model name)
- **US2 Agent (Phase 4)**: Depends on T009-T015 (tools exist)
- **US3 API (Phase 5)**: Depends on T016-T020 (agent exists) and T005-T007 (models + schemas exist)
- **US4 Tests (Phase 6)**: Depends on T022-T025 (endpoints exist). Test tasks T027-T029 can run in parallel.
- **Polish (Phase 7)**: Depends on all previous phases

### User Story Dependencies

- **US1 (Tools)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (Agent)**: Depends on US1 completion (tools needed to create agent)
- **US3 (API)**: Depends on US2 completion (agent needed for chat endpoint)
- **US4 (Tests)**: Depends on US3 completion (endpoints needed for integration tests). Model tests (T027) can start after Phase 2.

### Critical Path

```
T001 → T002 → T005/T006/T007 → T009-T015 → T016-T020 → T021-T026 → T027-T030 → T031-T035
 Setup    Install    Models/Schemas    Tools       Agent       API Endpoints   Tests     Polish
```

### Within Each Phase

- Models (T005, T006) can run in parallel (different classes, same file — work carefully)
- Tools (T011-T015) are sequential within `tools.py` (same file, each builds on factory)
- Test files (T027, T028, T029) can run in parallel (different files)

### Parallel Opportunities

- T003 + T004 (config + env example) can run in parallel with T005-T006 (models)
- T007 (Pydantic schemas) can run in parallel with T005-T006 (different section of different file)
- T027, T028, T029 (test files) can all run in parallel

---

## Parallel Example: Phase 2 (Foundational)

```bash
# These three tasks can be launched in parallel (different files):
Task T005: "Add Conversation model to backend/models.py"
Task T006: "Add Message model to backend/models.py"       # Same file as T005 - coordinate
Task T007: "Add Pydantic schemas to backend/routes/chat.py"  # Different file - truly parallel
```

## Parallel Example: Phase 6 (Tests)

```bash
# All test files can be created in parallel:
Task T027: "Create backend/tests/test_chat_models.py"
Task T028: "Create backend/tests/test_tools.py"
Task T029: "Create backend/tests/test_chat.py"
```

---

## Implementation Strategy

### MVP First (Tools + Agent + Single Endpoint)

1. Complete Phase 1: Setup (T001-T004)
2. Complete Phase 2: Models (T005-T008)
3. Complete Phase 3: Tools (T009-T015)
4. Complete Phase 4: Agent (T016-T020)
5. Implement POST /api/chat only (T021-T023, T025)
6. **STOP and VALIDATE**: Send a chat message, get AI response
7. This is the MVP — natural language task management works

### Incremental Delivery

1. Setup + Models → Foundation ready
2. Tools + Agent → AI processing pipeline ready
3. POST /api/chat → **MVP! Chat works end-to-end**
4. GET /messages → Conversation history retrieval
5. Tests → Quality assurance
6. Polish → Production readiness

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps: US1=Tools, US2=Agent, US3=API, US4=Tests
- All tools use `@function_tool` decorator from `openai-agents` package
- user_id injected via closure in `create_tools_for_user()` — AI agent never sees user_id
- Mock `Runner.run()` in all tests to avoid real OpenAI API calls
- Existing `backend/tests/conftest.py` has auth mock patterns — reuse for chat tests
- `tool_calls_json` serialization: `None` when no tools, `json.dumps(list)` when tools called
- Frontend is 100% complete — backend just needs to implement the API contract
