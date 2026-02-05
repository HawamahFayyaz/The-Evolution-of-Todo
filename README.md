# DoNext - Task Management Application

AI-powered task management that adapts to your workflow. Stay organized, focused, and productive.

---

## Project Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase I | ✅ Complete | Console CLI Application |
| Phase II | ✅ Complete | Full-Stack Web Application |
| Phase III | 🔜 Planned | AI Chatbot Integration |
| Phase IV | 🔜 Planned | Local Kubernetes Deployment |
| Phase V | 🔜 Planned | Cloud Deployment & Event-Driven |

---

## Phase II: Web Application ✅ COMPLETED

### Features Delivered
- User authentication (register, login, logout) via Better Auth
- Task CRUD operations (create, read, update, delete)
- Data persistence with Neon PostgreSQL
- User data isolation (users can only see their own tasks)
- Responsive React frontend with TypeScript
- FastAPI backend with session authentication
- Security logging for unauthorized access attempts
- Toast notifications and error handling
- Filter tabs (All/Active/Completed) with URL persistence
- Delete confirmation dialogs

### Tech Stack

**Frontend**
- Next.js 16+ with App Router
- TypeScript (strict mode)
- Tailwind CSS v4
- Better Auth (email/password)
- Sonner (toast notifications)
- Heroicons

**Backend**
- FastAPI
- SQLModel (SQLAlchemy + Pydantic)
- Neon PostgreSQL (serverless)
- Session-based authentication

### Quick Start

See [specs/001-fullstack-web/quickstart.md](./specs/001-fullstack-web/quickstart.md) for complete setup instructions.

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Edit with your credentials
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local  # Edit with your credentials
npm run dev
```

#### Verify
- Frontend: http://localhost:3000
- Backend API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

---

## Phase I: Console CLI ✅ COMPLETED

A command-line todo application built with Python 3.13+ using only the standard library.

### Features
- Add tasks with title and optional description
- List all tasks with status filtering (all/pending/completed)
- Update task title and description
- Delete tasks with confirmation
- Toggle task completion status
- Built-in help system

### Usage
```bash
# Run the application
uv run python -m src.main

# Commands
> add "Buy groceries"           # Create task
> list                          # Show all tasks
> list pending                  # Show pending only
> complete 1                    # Toggle completion
> update 1 "New title" "desc"   # Update task
> delete 1                      # Delete task
> help                          # Show help
> exit                          # Exit
```

---

## Project Structure

```
hackathon-todo/
├── backend/                    # FastAPI backend (Phase II)
│   ├── main.py                 # App entry point
│   ├── models.py               # SQLModel schemas
│   ├── routes/                 # API endpoints
│   └── tests/                  # Backend tests
├── frontend/                   # Next.js frontend (Phase II)
│   ├── app/                    # App Router pages
│   ├── components/             # React components
│   ├── lib/                    # Utilities and API client
│   └── hooks/                  # Custom React hooks
├── src/                        # Console CLI (Phase I)
├── tests/                      # Phase I tests
├── specs/                      # Specifications
│   └── 001-fullstack-web/      # Phase II specs
└── .claude/                    # Claude Code agents & skills
```

---

## Development

### Backend Tests
```bash
cd backend
pytest -v --cov=. --cov-report=term-missing
```

### Frontend Development
```bash
cd frontend
npm run dev        # Development server
npm run build      # Production build
npm run lint       # ESLint check
```

### Code Quality
```bash
# Backend linting
cd backend
ruff check .
ruff format .

# Frontend linting
cd frontend
npm run lint
```

---

## Documentation

- [Phase II Completion Report](./PHASE_II_COMPLETION_REPORT.md)
- [Phase II Quickstart Guide](./specs/001-fullstack-web/quickstart.md)
- [API Documentation](http://localhost:8000/docs) (when running)
- [Project Constitution](./.specify/memory/constitution.md)

---

## License

MIT
