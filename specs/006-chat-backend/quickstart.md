# Quickstart: 006-chat-backend

**Branch**: `006-chat-backend` | **Date**: 2026-02-08

---

## Prerequisites

- Python 3.13+ with venv at project root (`.venv/`)
- Neon PostgreSQL database (existing from Phase II)
- OpenAI API key

## Setup

### 1. Install Dependencies

```bash
cd /mnt/d/HACKATHON_02/hackathon-todo
uv pip install --python .venv/bin/python openai-agents>=0.7.0
```

### 2. Add Environment Variables

Add to `backend/.env`:
```bash
# Existing (Phase II)
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
ALLOWED_ORIGINS=http://localhost:3000

# New (Phase III)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini   # optional, defaults to gpt-4o-mini
```

### 3. Update requirements.txt

Add to `backend/requirements.txt`:
```
openai-agents>=0.7.0
```

### 4. Verify Table Creation

Tables are created automatically on startup via `create_db_and_tables()` in `main.py`.
Just restart the backend server:

```bash
cd backend && uvicorn main:app --reload
```

Check logs for table creation, or verify via:
```bash
# Tables should include: conversations, messages
```

### 5. Test Chat Endpoint

```bash
# Get a session token first (from frontend login)
TOKEN="your-session-token"

# Send a chat message
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Add buy groceries to my list"}'

# Expected response:
# {
#   "conversation_id": 1,
#   "response": "I've added 'Buy groceries' to your task list.",
#   "tool_calls": [{"tool": "add_task", "args": {"title": "Buy groceries"}, "result": {...}}]
# }
```

## New File Structure

```
backend/
├── main.py              # + chat_router registration
├── models.py            # + Conversation, Message models
├── config.py            # + OPENAI_API_KEY, OPENAI_MODEL
├── agent/               # NEW directory
│   ├── __init__.py
│   ├── tools.py         # 5 @function_tool definitions
│   └── chat_agent.py    # Agent creation + Runner execution
└── routes/
    ├── tasks.py         # Existing (unchanged)
    └── chat.py          # NEW: POST /api/chat, GET /api/conversations/.../messages
```

## Key Integration Points

1. **models.py**: Add `Conversation` and `Message` SQLModel classes (auto-create tables)
2. **config.py**: Add `openai_api_key` and `openai_model` settings
3. **agent/tools.py**: 5 `@function_tool` functions wrapping task CRUD
4. **agent/chat_agent.py**: Agent factory + `run_agent()` function
5. **routes/chat.py**: Two endpoints + Pydantic request/response models
6. **main.py**: Register `chat_router`
