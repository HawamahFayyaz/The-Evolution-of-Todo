# Backend Context - FastAPI Todo API

## Overview
FastAPI backend for the Phase II todo application. Provides REST API endpoints for task management with JWT authentication.

## Tech Stack
- **Framework**: FastAPI with Pydantic v2
- **ORM**: SQLModel (SQLAlchemy + Pydantic)
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: JWT verification (tokens issued by Better Auth on frontend)

## Project Structure
```
backend/
├── main.py          # FastAPI app entry point, CORS, routers
├── config.py        # Environment variable loading
├── database.py      # SQLModel engine, session dependency
├── models.py        # SQLModel schemas (Task)
├── auth.py          # JWT verification, get_current_user dependency
├── routes/
│   └── tasks.py     # Task CRUD endpoints
└── tests/
    ├── conftest.py  # pytest fixtures
    ├── test_auth.py # Authentication tests
    └── test_tasks.py # Task API tests
```

## Critical Security Rules

### User ID from JWT Only
```python
# CORRECT: Extract user_id from verified JWT token
@router.get("/tasks")
async def list_tasks(current_user: str = Depends(get_current_user)):
    # current_user comes from JWT, not request
    tasks = session.exec(select(Task).where(Task.user_id == current_user))

# WRONG: Never trust client-provided user_id
async def list_tasks(user_id: str):  # Security vulnerability!
```

### Soft Deletes Only
```python
# CORRECT: Set deleted_at timestamp
task.deleted_at = datetime.utcnow()
session.add(task)
session.commit()

# WRONG: Never hard delete
session.delete(task)  # Forbidden by constitution
```

### Data Isolation
All queries MUST filter by user_id:
```python
select(Task).where(
    Task.user_id == current_user,
    Task.deleted_at.is_(None)
)
```

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Liveness check |
| GET | /ready | Readiness check (DB) |
| GET | /api/tasks | List user's tasks |
| GET | /api/tasks/{id} | Get specific task |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/{id} | Update task |
| DELETE | /api/tasks/{id} | Soft delete task |
| PATCH | /api/tasks/{id}/complete | Toggle completion |

## Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `BETTER_AUTH_SECRET`: JWT secret (must match frontend)
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
pytest                    # Run all tests
pytest tests/test_auth.py # Run auth tests only
pytest -v                 # Verbose output
```
