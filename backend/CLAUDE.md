# Backend Context - FastAPI Todo API

## Overview
FastAPI backend for the todo application with AI-powered chat. Provides REST API endpoints for task management and AI chat with JWT authentication.

## Tech Stack
- **Framework**: FastAPI with Pydantic v2
- **ORM**: SQLModel (SQLAlchemy + Pydantic)
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Session token verification (tokens issued by Better Auth on frontend)
- **AI**: OpenAI Agents SDK (`openai-agents`) with `@function_tool` decorator
- **Rate Limiting**: slowapi

## Project Structure
```
backend/
├── main.py              # FastAPI app entry point, CORS, routers
├── config.py            # Environment variable loading (DB, auth, OpenAI)
├── database.py          # SQLModel engine, session dependency
├── models.py            # SQLModel schemas (Task, Conversation, Message)
├── auth.py              # Session verification, get_current_user dependency
├── rate_limiter.py      # Rate limiting config
├── security_logger.py   # Security event logging
├── agent/
│   ├── __init__.py      # Public API exports
│   ├── tools.py         # 5 @function_tool implementations + _impl functions
│   └── chat_agent.py    # Agent factory, async runner, system prompt
├── routes/
│   ├── tasks.py         # Task CRUD endpoints
│   └── chat.py          # Chat API endpoints (POST /api/chat, GET messages)
└── tests/
    ├── conftest.py      # pytest fixtures (auth, DB, tokens)
    ├── test_auth.py     # Authentication tests
    ├── test_tasks.py    # Task API tests
    ├── test_chat.py     # Chat endpoint tests (mocked AI)
    ├── test_chat_models.py  # Conversation/Message model tests
    └── test_tools.py    # Tool _impl function tests
```

## Critical Security Rules

### User ID from JWT Only
```python
# CORRECT: Extract user_id from verified session token
@router.get("/tasks")
async def list_tasks(current_user: str = Depends(get_current_user)):
    tasks = session.exec(select(Task).where(Task.user_id == current_user))

# WRONG: Never trust client-provided user_id
async def list_tasks(user_id: str):  # Security vulnerability!
```

### Soft Deletes Only
```python
task.deleted_at = datetime.now(UTC)
session.add(task)
session.commit()
```

### Data Isolation
All queries MUST filter by user_id:
```python
select(Task).where(
    Task.user_id == current_user,
    Task.deleted_at.is_(None)
)
```

### Tool user_id Injection
AI tools get user_id via closure — agent never sees it:
```python
tools = create_tools_for_user(current_user, session)  # user_id bound
agent = create_agent(tools)
result = await run_agent(agent, history)
```

## API Endpoints
| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| GET | /health | Liveness check | - |
| GET | /ready | Readiness check (DB) | - |
| GET | /api/tasks | List user's tasks | 60/min |
| GET | /api/tasks/search | Search tasks | 60/min |
| GET | /api/tasks/{id} | Get specific task | - |
| POST | /api/tasks | Create task | 30/min |
| PUT | /api/tasks/{id} | Update task | 30/min |
| DELETE | /api/tasks/{id} | Soft delete task | 30/min |
| PATCH | /api/tasks/{id}/complete | Toggle completion | - |
| POST | /api/chat | Send chat message | 10/min |
| GET | /api/conversations/{id}/messages | Get chat history | 30/min |

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Auth secret (must match frontend, min 32 chars)
- `OPENAI_API_KEY`: OpenAI API key (required for chat)
- `OPENAI_MODEL`: AI model name (default: gpt-4o-mini)
- `ALLOWED_ORIGINS`: CORS allowed origins
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)

## Running Locally
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
uvicorn main:app --reload
```

## Testing
```bash
pytest                          # Run all tests
pytest tests/test_chat.py -v    # Chat endpoint tests
pytest tests/test_tools.py -v   # Tool function tests
pytest tests/test_chat_models.py -v  # Model tests
pytest -v                       # Verbose output
```
