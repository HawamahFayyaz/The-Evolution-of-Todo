<!--
============================================================================
SYNC IMPACT REPORT
============================================================================
Version Change: 1.0.0 → 1.1.0 (MINOR - Phase II additions)

Modified Principles: None (all existing principles preserved)

Added Sections:
- Phase II Principles (4 new principles: VII-X)
- API Standards (under Technical Constraints)
- Database Standards (under Technical Constraints)
- Authentication Flow (under Technical Constraints)
- Security Requirements (under Technical Constraints)
- Code Standards: API Client Pattern (Phase II addition)

Removed Sections: None

Templates Requiring Updates:
- .specify/templates/plan-template.md: ✅ Compatible (Constitution Check section exists)
- .specify/templates/spec-template.md: ✅ Compatible (Requirements section aligns)
- .specify/templates/tasks-template.md: ✅ Compatible (Phase structure supports user stories)

Follow-up TODOs: None
============================================================================
-->

# Evolution of Todo Constitution

## Project Vision

**What**: A progressive todo application that evolves through five phases from a
simple console app to a cloud-native, event-driven system with AI-powered chatbot
capabilities.

**Why**: To demonstrate modern software development practices through incremental
enhancement, proving that proper architecture from day one enables seamless scaling
from local CLI to Kubernetes-orchestrated cloud infrastructure without breaking
existing functionality.

**Phases**:
- Phase I: Console CLI application (Python, in-memory storage) ✅ COMPLETED
- Phase II: Full-stack web application (Next.js + FastAPI + PostgreSQL) ← CURRENT
- Phase III: AI-powered chatbot interface (OpenAI Agents SDK + MCP)
- Phase IV: Containerized Kubernetes deployment (Docker + Helm + Minikube)
- Phase V: Cloud-native production system (Kafka + Dapr + CI/CD)

## Core Principles

### I. User Autonomy

Users MUST have complete control over their data at all times. This means:
- Users can create, read, update, and delete their tasks freely
- No hidden data manipulation or automatic modifications without consent
- Clear feedback on all operations affecting user data
- Data portability: users can export their data in standard formats

**Rationale**: Trust is built through transparency and control. Users who trust
the system will engage more deeply with it.

### II. Accessibility First

All operations MUST be intuitive and discoverable. Requirements:
- Commands and UI elements have clear, descriptive names
- Error messages explain what went wrong AND how to fix it
- Help is always one command/click away
- Consistent patterns across all phases (CLI flags mirror API parameters)
- Support for internationalization from Phase II onwards

**Rationale**: Accessibility reduces friction, increases adoption, and ensures
the application serves users of all skill levels.

### III. Spec-Driven Development

No code MUST be written without a corresponding specification. Workflow:
1. Constitution defines principles and constraints (this document)
2. Specify defines WHAT the feature does (requirements, user stories)
3. Plan defines HOW to implement (architecture, components)
4. Tasks break down into atomic work items
5. Implementation follows tasks exactly

**Rationale**: Specifications create shared understanding, prevent scope creep,
and ensure all stakeholders agree before development begins.

### IV. Progressive Enhancement

Each phase MUST add value without breaking previous functionality:
- Phase II MUST run Phase I commands via CLI compatibility layer
- Phase III chatbot MUST support all Phase II operations
- Phase IV containers MUST deploy Phase III features unchanged
- Phase V cloud MUST scale Phase IV without architectural rewrites

**Rationale**: Progressive enhancement protects investment in earlier phases and
ensures continuous delivery of working software.

### V. Cloud-Native Ready

Design for statelessness, scalability, and observability from day one:
- No session-dependent state in application code
- All state persisted to external stores (database, cache, message queue)
- Structured logging with correlation IDs
- Health check endpoints from Phase II onwards
- Metrics and tracing hooks built into core operations

**Rationale**: Retrofitting cloud-native patterns is expensive. Building them in
from the start makes scaling seamless.

### VI. Quality Over Speed

Proper error handling and edge cases are REQUIRED, not optional:
- Every public function handles its failure modes explicitly
- Edge cases are documented in specs and tested
- 80%+ test coverage is mandatory
- Code review required before merge
- No "temporary" hacks that become permanent

**Rationale**: Technical debt compounds. Investing in quality early reduces total
cost of ownership and enables faster iteration later.

## Phase II Principles

### VII. Full-Stack Consistency

Frontend TypeScript types MUST match backend SQLModel schemas:
- Use consistent naming conventions across the stack
- Handle snake_case (Python) vs camelCase (TypeScript) conversion explicitly
- API response transformation layer handles casing
- Shared types via OpenAPI-generated clients when possible
- Type mismatches are build-time errors, not runtime surprises

**Rationale**: Type inconsistency is the #1 source of full-stack bugs. Explicit
conversion points prevent silent data corruption.

### VIII. Stateless REST API

All API endpoints MUST be stateless:
- Authentication via JWT tokens only
- No server-side sessions
- Each request contains all information needed to process it
- No reliance on previous requests or cached user state
- Horizontal scaling without session affinity

**Rationale**: Statelessness enables horizontal scaling and simplifies deployment.
Server instances are interchangeable.

### IX. Multi-User Data Isolation

All data MUST be scoped to user_id:
- One user MUST NOT see another user's data
- JWT token provides user_id, NEVER request body
- All database queries filter by authenticated user's ID
- API endpoints extract user_id from verified JWT, not from request
- Trusting client-provided user_id is a CRITICAL security violation

**Rationale**: Multi-tenant security is non-negotiable. User isolation failures
are data breaches.

### X. Monorepo Organization

Frontend and backend MUST coexist in the same repository:
- Separate folders for frontend/ and backend/
- Shared types via OpenAPI specification
- Coordinated deployments ensure API compatibility
- Single source of truth for the entire application
- Each folder has its own CLAUDE.md for context

**Rationale**: Monorepo enables atomic changes across the stack and prevents
version drift between frontend and backend.

## Technical Constraints

### Tech Stack by Phase

| Phase | Frontend | Backend | Storage | Auth | Infrastructure |
|-------|----------|---------|---------|------|----------------|
| I | - | Python 3.13+ | In-memory | - | UV package manager |
| II | Next.js 16+ App Router | FastAPI | Neon PostgreSQL | Better Auth | SQLModel ORM, Vercel |
| III | OpenAI ChatKit | FastAPI + OpenAI Agents SDK | PostgreSQL | Better Auth + JWT | Official MCP SDK |
| IV | Next.js | FastAPI | PostgreSQL | Better Auth | Docker, Kubernetes, Helm, Minikube |
| V | Next.js | FastAPI | PostgreSQL | Better Auth | DOKS/GKE/AKS, Kafka, Dapr, CI/CD |

### Project Structure (Phase II)

```
hackathon-todo/
├── frontend/              # Next.js application
│   ├── app/               # App Router pages and layouts
│   ├── components/        # React components
│   ├── lib/               # Utilities, API client, auth
│   └── CLAUDE.md          # Frontend-specific context
├── backend/               # FastAPI application
│   ├── main.py            # Application entry point
│   ├── models.py          # SQLModel schemas
│   ├── routes/            # API route handlers
│   └── CLAUDE.md          # Backend-specific context
├── specs/                 # Feature specifications
├── CLAUDE.md              # Root project context
└── README.md              # Project documentation
```

### API Standards (Phase II+)

All REST API endpoints MUST follow these conventions:
- All routes under `/api/` prefix
- RESTful naming: `GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/{id}`
- JWT in `Authorization: Bearer <token>` header
- Consistent error responses with standard HTTP codes (401, 403, 404, 500)
- All responses in JSON format
- OpenAPI documentation auto-generated and accessible

### Database Standards (Phase II+)

All database models MUST include:
- `id`: Primary key (UUID recommended)
- `created_at`: Timestamp of creation (UTC)
- `updated_at`: Timestamp of last modification (UTC)
- `deleted_at`: Soft delete timestamp (nullable, UTC)
- `user_id`: Foreign key for user-scoped tables (indexed)

SQLModel is the ONLY allowed ORM. Direct SQL queries are forbidden except for
migrations.

### Authentication Flow (Phase II+)

The authentication flow MUST follow this sequence:
1. User logs in via Better Auth (Next.js frontend)
2. Better Auth issues JWT token with user claims
3. Frontend stores token in httpOnly cookie
4. Frontend sends token in Authorization header for API calls
5. Backend verifies JWT signature using shared secret
6. Backend extracts user_id from verified token claims
7. Backend filters ALL queries by authenticated user_id

### Security Requirements (Phase II+)

- JWT secret MUST be shared between frontend and backend securely
- Secrets MUST NOT appear in client-visible environment variables
- CORS MUST be configured to allow only known origins
- All endpoints MUST validate input (Pydantic handles this)
- SQL injection prevention via SQLModel (no raw SQL)
- BETTER_AUTH_SECRET MUST be at least 32 characters
- Production secrets managed via environment variables or secret manager

### Allowed Patterns

- **Data Models**: Dataclasses (Phase I), Pydantic/SQLModel (Phase II+)
- **API Design**: RESTful with JSON, OpenAPI documentation
- **State Management**: Server-side for data, client-side for UI only
- **Error Handling**: Result types or explicit exceptions with typed errors
- **Testing**: pytest (Python), Jest/Vitest (TypeScript), contract tests for APIs
- **Logging**: Structured JSON logs with level, timestamp, correlation_id
- **Soft Deletes**: All data marked `deleted_at` timestamp, never hard deleted

### Forbidden Patterns

- **Manual Coding**: All implementation MUST use Claude Code (hackathon rule)
- **Hard Deletes**: Data MUST never be permanently removed from storage
- **Local Timestamps**: All timestamps MUST be UTC
- **Secrets in Code**: All secrets MUST use environment variables or secret managers
- **Synchronous Long Operations**: Background jobs for anything >500ms
- **Direct Database Access**: All queries through ORM/repository layer
- **Implicit State**: No global mutable state; all state explicit and injectable
- **Trusting Client user_id**: NEVER use user_id from request body; always from JWT

## Code Standards

### Python (Phase I-V Backend)

```python
# Naming
def get_task_by_id(task_id: str) -> Task | None:  # snake_case functions
    """Retrieve a task by its unique identifier.

    Args:
        task_id: The UUID of the task to retrieve.

    Returns:
        The Task if found, None otherwise.
    """
    pass

class TaskService:  # PascalCase classes
    pass

RETRY_LIMIT = 3  # UPPER_SNAKE_CASE constants

# Structure
- Type hints on ALL function signatures
- Docstrings on ALL public functions
- Max function length: 30 lines
- Max file length: 500 lines
- One class per file for models, services grouped by domain
```

### TypeScript/Next.js (Phase II-V Frontend)

```typescript
// Naming
async function getTaskById(taskId: string): Promise<Task | null> {  // camelCase
  // Note: params and searchParams are Promises in Next.js 16
}

interface TaskListProps {  // PascalCase interfaces
  tasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks }) => {  // PascalCase components
  // Use Server Components by default
  // Client Components only for interactivity
};

// Structure
- TypeScript strict mode MUST be enabled
- async/await for all async operations (no .then chains)
- Explicit return types on all functions
- Props interfaces defined for all components
- Environment variables via .env.local
```

### API Client Pattern (Phase II+)

```typescript
// All backend calls MUST go through an API client layer
// Located in frontend/lib/api/

// Example structure:
// frontend/lib/api/client.ts - Base fetch wrapper with auth
// frontend/lib/api/tasks.ts - Task-specific API functions

// Benefits:
// - Centralized error handling
// - Automatic token injection
// - Type-safe request/response
// - Easy to mock for testing
```

### YAML/Kubernetes (Phase IV-V)

```yaml
# All deployments MUST include:
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "500m"

livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 10

# Secrets: NEVER inline, always reference external
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: app-secrets
        key: database-url
```

## Quality Gates

### Phase I: Console CLI ✅ COMPLETED

Definition of Done:
- [x] All CRUD operations work via CLI commands
- [x] Help command documents all available commands
- [x] Error messages are user-friendly and actionable
- [x] 80%+ test coverage with pytest
- [x] Type hints on all functions pass mypy strict
- [x] Code formatted with ruff
- [x] README documents installation and usage

### Phase II: Web Application

Definition of Done (includes Phase I):
- [ ] REST API with OpenAPI documentation
- [ ] Next.js frontend with responsive design
- [ ] User authentication with Better Auth
- [ ] Multi-user data isolation (users see only their data)
- [ ] Database migrations versioned and reversible
- [ ] Integration tests for all API endpoints
- [ ] Internationalization infrastructure in place
- [ ] JWT authentication flow working end-to-end
- [ ] API client pattern implemented in frontend
- [ ] TypeScript strict mode enabled

### Phase III: AI Chatbot

Definition of Done (includes Phase II):
- [ ] Natural language task management via chat
- [ ] OpenAI Agents SDK integration
- [ ] MCP tools for all CRUD operations
- [ ] Stateless architecture (no session state in app)
- [ ] Conversation history persisted to database
- [ ] Fallback to structured UI when AI uncertain

### Phase IV: Kubernetes Deployment

Definition of Done (includes Phase III):
- [ ] Multi-stage Dockerfiles for frontend and backend
- [ ] Helm charts for all components
- [ ] Successful deployment to Minikube
- [ ] Health checks passing for all pods
- [ ] Resource limits set appropriately
- [ ] Secrets managed via Kubernetes secrets
- [ ] Horizontal Pod Autoscaler configured

### Phase V: Cloud-Native Production

Definition of Done (includes Phase IV):
- [ ] Deployed to managed Kubernetes (DOKS/GKE/AKS)
- [ ] Event-driven architecture with Kafka + Dapr
- [ ] CI/CD pipeline with automated testing and deployment
- [ ] Monitoring with Prometheus/Grafana
- [ ] Distributed tracing enabled
- [ ] Auto-scaling under load tested
- [ ] Disaster recovery plan documented

## Governance

### Amendment Process

1. Propose amendment in a spec document with rationale
2. Review against existing principles for conflicts
3. If approved, update this constitution with:
   - Increment version (MAJOR for principle changes, MINOR for additions, PATCH for clarifications)
   - Update LAST_AMENDED_DATE
   - Document change in Sync Impact Report
4. Propagate changes to dependent templates

### Compliance

- All pull requests MUST reference the spec/task they implement
- Code review MUST verify compliance with relevant principles
- Violations require either code change or amendment proposal
- Constitution supersedes all other documentation in conflicts

### Version Policy

- MAJOR: Backward-incompatible principle changes or removals
- MINOR: New principles or sections added
- PATCH: Clarifications, typos, non-semantic refinements

**Version**: 1.1.0 | **Ratified**: 2026-01-01 | **Last Amended**: 2026-01-15
