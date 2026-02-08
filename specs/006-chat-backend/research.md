# Research: 006-chat-backend

**Branch**: `006-chat-backend` | **Date**: 2026-02-08
**Phase**: 0 (Research) | **Status**: Complete

---

## Technology Decisions

### 1. Agent Framework: OpenAI Agents SDK (`openai-agents`)

**Decision**: Use `openai-agents>=0.7.0` with `@function_tool` decorator.

**Rationale**:
- Constitution mandates "OpenAI Agents SDK" for Phase III
- SDK provides `Agent`, `Runner`, `@function_tool` primitives
- `@function_tool` auto-generates JSON schemas from Python type hints
- Supports async execution via `Runner.run(agent, input)`
- `LitellmModel` extension allows swapping LLM providers without code changes

**Key API Surface**:
```python
from agents import Agent, Runner, function_tool

@function_tool
def add_task(user_id: str, title: str) -> dict:
    """Create a new task."""
    ...

agent = Agent(
    name="TodoAssistant",
    instructions="...",
    tools=[add_task, list_tasks, complete_task, delete_task, update_task],
    model="gpt-4o-mini",
)

result = await Runner.run(agent, input="Add buy groceries")
print(result.final_output)  # "I've added 'Buy groceries' to your list."
```

### 2. MCP Tools: `@function_tool` (NOT Separate MCP Server)

**Decision**: Implement tools as `@function_tool` decorated functions in the backend process, NOT as a separate MCP server.

**Rationale**:
- Constitution Principle XII requires "MCP tools" (the pattern), not necessarily a separate MCP server process
- `@function_tool` satisfies all requirements: stateless, user_id required, structured returns, database-backed
- No inter-process communication overhead
- Simpler deployment (single backend process)
- Same database session management as existing `routes/tasks.py`
- Blueprint shows MCP Server as separate component (K8s optimization), but for Phase III implementation a single process is pragmatic; can extract to separate service in Phase IV/V if needed

**Trade-off**: Less separation of concerns than separate MCP server, but significantly simpler for hackathon scope. Tools are thin wrappers (~20 lines each) so extraction later is trivial.

### 3. Session/History Management: Custom PostgreSQL (NOT SQLiteSession)

**Decision**: Manage conversation history in our existing Neon PostgreSQL database. Do NOT use the SDK's built-in `SQLiteSession`.

**Rationale**:
- The SDK's `SQLiteSession` stores history in a local SQLite file
- We already have Neon PostgreSQL with established connection pooling
- Our spec defines `conversations` and `messages` tables
- Custom management gives us full control over:
  - Message format (tool_calls_json field)
  - History truncation (limit=50 for cost control)
  - Soft deletes
  - User isolation queries
- Consistent with existing `database.py` patterns

**Implementation Pattern**:
```python
# Load history from PostgreSQL
messages = load_messages(conversation_id, session, limit=50)

# Build input for agent (list of dicts)
input_messages = [
    {"role": m.role, "content": m.content}
    for m in messages
]

# Run agent with history as context
result = await Runner.run(agent, input=input_messages)
```

### 4. LLM Model: GPT-4o-mini (Configurable)

**Decision**: Default to `gpt-4o-mini` for cost efficiency. Make model configurable via environment variable.

**Rationale**:
- `gpt-4o-mini` is ~15x cheaper than `gpt-4o` with adequate quality for task management
- Tool calling works reliably on all GPT-4o variants
- Environment variable `OPENAI_MODEL` allows switching without code changes
- Can upgrade to `gpt-4o` or future models trivially

### 5. New Python Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `openai-agents` | `>=0.7.0` | Agent framework, Runner, function_tool |
| `openai` | `>=1.68.0` | OpenAI API client (dependency of openai-agents) |

**Note**: `openai-agents` pulls in `openai` as a dependency. No other new packages needed - we already have FastAPI, SQLModel, slowapi, etc.

### 6. Environment Variables (New)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | Yes | - | OpenAI API key for LLM calls |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | LLM model identifier |

---

## Architecture Decision: Stateless Agent Per Request

Each chat request creates a fresh agent instance. No agent state persists between requests.

**Flow**:
1. Request arrives at `POST /api/chat`
2. Verify session token → get `user_id`
3. Get or create conversation in DB
4. Save user message to DB
5. Load last 50 messages from DB
6. Create ephemeral agent with tools (tools receive `user_id` via closure)
7. `Runner.run(agent, input=messages_from_db)`
8. Extract `final_output` and tool calls from result
9. Save assistant response + tool calls to DB
10. Return response to frontend
11. Agent instance is garbage collected

**Why ephemeral agents**: Constitution Principle XI forbids stateful agents. Ephemeral agents guarantee no in-memory state leaks between requests.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| OpenAI API downtime | Low | High | 503 response with friendly message, frontend shows fallback |
| Slow LLM responses (>5s) | Medium | Medium | 30s timeout, async handler doesn't block server |
| Tool call failures (DB errors) | Low | Low | Tools return error dict, agent explains to user |
| Rate limiting by OpenAI | Low | Medium | Our own rate limit (10/min/user) prevents overuse |
| Cost overrun from large histories | Medium | Medium | Hard limit of 50 messages per context window |

---

## Unknowns Resolved

| Unknown | Resolution |
|---------|-----------|
| LLM provider choice | OpenAI (gpt-4o-mini), configurable via env var |
| Agent framework | `openai-agents` SDK with `@function_tool` |
| MCP server needed? | No - `@function_tool` in same process |
| Session management | Custom PostgreSQL, not SQLiteSession |
| How to pass history | Load from DB → format as message list → pass to Runner.run() |
| New dependencies | `openai-agents>=0.7.0` only |
| Tool user_id injection | Closure pattern - chat endpoint creates tools with user_id bound |
