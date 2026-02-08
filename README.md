# DoNext - AI-Powered Task Management

AI-powered task management that adapts to your workflow. Create, organize, and conquer with natural language and smart automation.

---

## Project Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase I | ✅ Complete | Console CLI Application |
| Phase II | ✅ Complete | Full-Stack Web Application |
| Phase III | ✅ Complete | AI Chatbot Integration |
| Phase IV | ✅ Complete | Kubernetes Deployment |
| Phase V | 🔜 Planned | Cloud Deployment & Event-Driven |

---

## Features

### Task Management
- Create, read, update, delete tasks with priorities (Low/Medium/High)
- **Tags** - color-coded labels for organizing tasks
- **Recurring tasks** - daily, weekly, or monthly auto-creation on completion
- **Datetime due dates** - set precise deadlines with time
- **Sort** - by newest, oldest, due date, priority, or alphabetical
- **Priority filter** - filter by High/Medium/Low priority
- **Tag filter** - filter by any tag
- **Search** - full-text search across titles and descriptions
- **Filter tabs** - All/Active/Completed with URL persistence
- **Browser notifications** - reminders 15 minutes before due

### AI Chat Assistant
- Natural language task management ("Add buy groceries due tomorrow")
- Floating chat widget accessible from every dashboard page
- OpenAI Agents SDK with function tools for task CRUD
- Conversation history persistence

### Authentication & Security
- Email/password auth via Better Auth
- JWT session tokens with secure cookie handling
- User data isolation (users only see their own data)
- Security logging for unauthorized access attempts
- Rate limiting on all endpoints

### Dashboard
- Real-time stats (Total/Completed/Pending)
- Today's Focus with upcoming tasks
- Quick actions and AI assistant card
- Keyboard shortcuts (Cmd+K command palette)

### Infrastructure
- Dockerized frontend and backend
- Helm chart for Kubernetes deployment
- Minikube-verified local deployment
- Health checks and readiness probes

---

## Tech Stack

**Frontend**
- Next.js 16+ (App Router), React 19, TypeScript
- Tailwind CSS v4 with Indigo/Violet design system
- Better Auth, Framer Motion, Lucide React, Sonner

**Backend**
- FastAPI, SQLModel (SQLAlchemy + Pydantic)
- Neon PostgreSQL (serverless)
- OpenAI Agents SDK (`openai-agents`)
- slowapi (rate limiting), python-dateutil

**Infrastructure**
- Docker (multi-stage builds)
- Kubernetes + Helm
- Minikube for local development

---

## Quick Start

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Edit with your credentials
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local  # Edit with your credentials
npm run dev
```

### Verify
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs
- Health: http://localhost:8000/health

### Kubernetes (Minikube)
```bash
# Build images
docker build -t todo-backend:latest ./backend
docker build -t todo-frontend:latest ./frontend

# Load into Minikube
minikube image load todo-backend:latest
minikube image load todo-frontend:latest

# Deploy with Helm
helm install todo-app k8s/ -f k8s/values-dev.yaml \
  --set secrets.DATABASE_URL="..." \
  --set secrets.BETTER_AUTH_SECRET="..." \
  --set secrets.OPENAI_API_KEY="..."
```

---

## Project Structure

```
hackathon-todo/
├── backend/                    # FastAPI backend
│   ├── main.py                 # App entry point, CORS, routers
│   ├── models.py               # SQLModel schemas (Task, Conversation, Message)
│   ├── agent/                  # AI chat agent + function tools
│   ├── routes/                 # API endpoints (tasks, chat)
│   └── tests/                  # 75 backend tests
├── frontend/                   # Next.js frontend
│   ├── app/                    # App Router pages
│   ├── components/             # React components
│   │   ├── chat/               # Floating chat widget
│   │   ├── dashboard/          # Dashboard overview
│   │   ├── landing/            # Landing page
│   │   ├── layout/             # Sidebar + header
│   │   ├── tasks/              # Task CRUD components
│   │   └── ui/                 # Reusable UI primitives
│   ├── hooks/                  # Custom hooks (tasks, chat, reminders)
│   ├── lib/                    # API client, auth, utilities
│   └── __tests__/              # 33 frontend tests
├── k8s/                        # Helm chart + Kubernetes manifests
├── src/                        # Console CLI (Phase I)
├── specs/                      # Feature specifications
└── .claude/                    # Claude Code agents & skills
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Liveness check |
| GET | /ready | Readiness check (DB) |
| GET | /api/tasks | List tasks |
| GET | /api/tasks/search | Search tasks |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/{id} | Update task |
| DELETE | /api/tasks/{id} | Soft delete task |
| PATCH | /api/tasks/{id}/complete | Toggle completion |
| POST | /api/chat | Send chat message |
| GET | /api/conversations/{id}/messages | Get chat history |

---

## Development

### Tests
```bash
# Backend (75 tests)
cd backend && pytest -v

# Frontend (33 tests)
cd frontend && npm run test
```

### Code Quality
```bash
# Backend
cd backend && ruff check . && ruff format .

# Frontend
cd frontend && npm run lint
```

---

## Phase I: Console CLI

A command-line todo app built with Python 3.13+ using only the standard library.

```bash
uv run python -m src.main

# Commands
> add "Buy groceries"           # Create task
> list                          # Show all tasks
> list pending                  # Show pending only
> complete 1                    # Toggle completion
> update 1 "New title" "desc"   # Update task
> delete 1                      # Delete task
```

---

## License

MIT
