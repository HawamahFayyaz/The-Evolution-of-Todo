# Hackathon Todo - Spec-Driven Development
This file tells Claude Code how to work on this project efficiently.

## Core Principle
Spec-Driven Development: **Constitution → Specify → Plan → Tasks → Implement**


See `@AGENTS.md` for detailed rules.
---

## Auto-Activation Rules (READ THIS CAREFULLY, CLAUDE!)

### When Working on Specifications

**IF** the task involves:
* Creating or reviewing spec files
* Validating requirements
* Checking architecture alignment
* Ensuring task completeness

**THEN** you MUST:
1. Read `@.claude/agents/spec-architect.md`
2. Apply those principles
3. Follow the review checklist
4. **USE THESE SKILLS**: `@.claude/skills/spec-writer/`
---

### When Working on API Endpoints

**IF** the task involves:
* Creating REST API endpoints
* Designing request/response schemas
* Coordinating frontend/backend
* Ensuring data model consistency

**THEN** you MUST:
1. Read `@.claude/agents/fullstack-architect.md`
2. Read `@.claude/agents/auth-security-expert.md` (for protected endpoints)
3. Apply both perspectives
4. **USE THESE SKILLS**:
   - `@.claude/skills/api-spec-generator/`
   - `@.claude/skills/database-schema/`
   - `@.claude/skills/better-auth-integrator/` (if authentication involved)
5. **USE THIS BLUEPRINT**: `@.claude/blueprints/basic-web-app/` (Phase 2)
---

### When Working on Frontend (Next.js)

**IF** the task involves:
* Creating Next.js pages or layouts
* Implementing Better Auth
* Building UI components
* Deciding server vs client components

**THEN** you MUST:
1. Read `@.claude/agents/nextjs-app-builder.md`
2. Read `@.claude/agents/auth-security-expert.md` (for protected routes)
3. Apply App Router patterns
4. **USE THESE SKILLS**: `@.claude/skills/better-auth-integrator/`
5. **USE THIS BLUEPRINT**: `@.claude/blueprints/basic-web-app/` (Phase 2)
---

### When Working on Authentication

**IF** the task involves:
* JWT tokens
* Better Auth setup
* Protected routes
* User authentication

**THEN** you MUST:
1. Read `@.claude/agents/auth-security-expert.md`
2. Follow ALL security checklists
3. Never trust client-provided `user_id`
4. **USE THESE SKILLS**: `@.claude/skills/better-auth-integrator/`
---

### When Working on Database Models

**IF** the task involves:
* SQLModel schemas
* Database migrations
* Model relationships
* Data validation

**THEN** you MUST:
1. Read `@.claude/agents/fullstack-architect.md` (for consistency)
2. **USE THESE SKILLS**: `@.claude/skills/database-schema/`
---

### When Working on AI/Chatbot (Phase 3+)

**IF** the task involves:
* OpenAI Agents SDK
* MCP server setup
* Conversation state
* Natural language processing

**THEN** you MUST:
1. Read `@.claude/agents/ai-integration-specialist.md`
2. Ensure stateless architecture
3. Persist state to database
4. **USE THESE SKILLS**: `@.claude/skills/mcp-tool-builder/`
5. **USE THIS BLUEPRINT**: `@.claude/blueprints/ai-chatbot/` (Phase 3)
---

### When Working on Kubernetes (Phase 4-5)

**IF** the task involves:
* Docker containers
* Kubernetes manifests
* Helm charts
* Deployment troubleshooting

**THEN** you MUST:
1. Read `@.claude/agents/kubernetes-engineer.md`
2. Follow K8s best practices
3. **USE THESE SKILLS**:
   - `@.claude/skills/dockerfile-generator/`
   - `@.claude/skills/helm-chart-builder/`
   - `@.claude/skills/dapr-config-generator/` (Phase 5)
4. **USE THIS BLUEPRINT**: `@.claude/blueprints/event-driven/` (Phase 5)
---

### When Working on Tests

**IF** the task involves:
* Unit tests
* Integration tests
* Test coverage
* Test automation

**THEN** you MUST:
1. **USE THESE SKILLS**: `@.claude/skills/test-generator/`
---

### When Working on CI/CD Pipelines

**IF** the task involves:
* GitHub Actions
* Deployment pipelines
* Automated testing
* Build automation

**THEN** you MUST:
1. **USE THESE SKILLS**: `@.claude/skills/cicd-pipeline/`
---

## Complete Agent-Skill-Blueprint Mapping

### Phase 1: Console App ✅ COMPLETED

**Agents:**
* `spec-architect` (reviews specs)

**Skills:**
* `spec-writer` (generate specs)
* `test-generator` (create tests)

**Blueprints:**
* None (simple console app)
---

### Phase 2: Web App 🚧 CURRENT PHASE

**Agents:**
* **Primary**: `fullstack-architect`, `nextjs-app-builder`
* **Cross-cutting**: `auth-security-expert` (ALWAYS)
* **Validator**: `spec-architect` (before implementation)

**Skills:**
* `api-spec-generator` (REST endpoints)
* `database-schema` (SQLModel models)
* `better-auth-integrator` (JWT + Better Auth)
* `test-generator` (tests)

**Blueprints:**
* `basic-web-app` (project structure template)

**Example Workflow:**
```
1. Create spec → spec-architect validates
2. Design API → fullstack-architect + api-spec-generator skill
3. Add auth → auth-security-expert + better-auth-integrator skill
4. Create DB models → fullstack-architect + database-schema skill
5. Build frontend → nextjs-app-builder + basic-web-app blueprint
6. Write tests → test-generator skill
```
---

### Phase 3: AI Chatbot

**Agents:**
* **Primary**: `ai-integration-specialist`
* **Supporting**: `fullstack-architect`, `auth-security-expert`
* **Validator**: `spec-architect`

**Skills:**
* `mcp-tool-builder` (MCP server tools)
* `api-spec-generator` (chat endpoints)
* `better-auth-integrator` (secure chat)

**Blueprints:**
* `ai-chatbot` (stateless chat architecture)

**Example Workflow:**
```
1. Create chat spec → spec-architect validates
2. Design MCP tools → ai-integration-specialist + mcp-tool-builder skill
3. Build chat API → fullstack-architect + api-spec-generator
4. Add security → auth-security-expert + better-auth-integrator
5. Use template → ai-chatbot blueprint
```
---

### Phase 4: Local Kubernetes

**Agents:**
* **Primary**: `kubernetes-engineer`
* **Supporting**: `fullstack-architect` (for app structure)

**Skills:**
* `dockerfile-generator` (containers)
* `helm-chart-builder` (K8s manifests)

**Blueprints:**
* None (basic deployment)

**Example Workflow:**
```
1. Containerize apps → kubernetes-engineer + dockerfile-generator
2. Create Helm charts → kubernetes-engineer + helm-chart-builder
3. Deploy locally → kubernetes-engineer
```
---

### Phase 5: Cloud Deployment

**Agents:**
* **Primary**: `kubernetes-engineer`
* **Supporting**: `fullstack-architect` (event-driven design)

**Skills:**
* `helm-chart-builder` (production manifests)
* `dapr-config-generator` (Dapr components)
* `kafka-event-designer` (event schemas)

**Blueprints:**
* `event-driven` (Kafka + Dapr architecture)

**Example Workflow:**
```
1. Design events → fullstack-architect + kafka-event-designer
2. Configure Dapr → kubernetes-engineer + dapr-config-generator
3. Deploy to cloud → kubernetes-engineer + helm-chart-builder
4. Use template → event-driven blueprint
```
---

## Available Resources Reference

### Agents (Specialist Knowledge)

Located in `.claude/agents/`:

| Agent | Purpose | When to Use |
|-------|---------|-------------|
| `spec-architect` | Validates specs, ensures completeness | Before implementation, during spec review |
| `fullstack-architect` | Coordinates frontend/backend, API design | Creating APIs, coordinating systems |
| `nextjs-app-builder` | Next.js App Router patterns | Building frontend pages/components |
| `auth-security-expert` | JWT, Better Auth, security | ALL protected endpoints and routes |
| `ai-integration-specialist` | OpenAI SDK, MCP, stateless chat | Phase 3+ chatbot development |
| `kubernetes-engineer` | K8s, Helm, Docker, deployment | Phase 4-5 infrastructure |

---

### Skills (Code Generators)

Located in `.claude/skills/`:

| Skill | Purpose | Used By |
|-------|---------|---------|
| `api-spec-generator` | REST API specifications | fullstack-architect |
| `better-auth-integrator` | Authentication setup | auth-security-expert, nextjs-app-builder |
| `cicd-pipeline` | GitHub Actions workflows | kubernetes-engineer |
| `dapr-config-generator` | Dapr components | kubernetes-engineer |
| `database-schema` | SQLModel models | fullstack-architect |
| `dockerfile-generator` | Container files | kubernetes-engineer |
| `helm-chart-builder` | Kubernetes charts | kubernetes-engineer |
| `i18n-integrator` | Multi-language support | nextjs-app-builder (bonus) |
| `kafka-event-designer` | Event schemas | fullstack-architect (Phase 5) |
| `mcp-tool-builder` | MCP tool definitions | ai-integration-specialist |
| `monitoring-setup` | Observability config | kubernetes-engineer |
| `spec-writer` | Feature specifications | spec-architect |
| `test-generator` | Unit/integration tests | All agents |
| `voice-interface` | Voice command support | nextjs-app-builder (bonus) |

---

### Blueprints (Architecture Templates)

Located in `.claude/blueprints/`:

| Blueprint | Purpose | When to Use |
|-----------|---------|-------------|
| `basic-web-app` | Next.js + FastAPI monorepo structure | Starting Phase 2 |
| `ai-chatbot` | Stateless chat with MCP tools | Starting Phase 3 |
| `event-driven` | Kafka + Dapr microservices | Starting Phase 5 |

---

## Project Structure Reference

```
hackathon-todo/
├── .claude/
│   ├── agents/           # Specialist knowledge (auto-read by Claude)
│   ├── skills/           # Code generators (used by agents)
│   ├── blueprints/       # Architecture templates
│   └── commands/         # SpecKitPlus commands
├── specs/
│   ├── constitution.md   # Project principles
│   ├── features/         # Feature specifications
│   └── api/              # API specifications
├── frontend/             # Next.js application (Phase 2+)
├── backend/              # FastAPI application (Phase 2+)
├── src/                  # Python console app (Phase 1) ✅
├── tests/                # Test files
├── AGENTS.md             # Detailed workflow rules
├── CLAUDE.md             # This file
└── README.md             # Project documentation
```

## Active Technologies
- Python 3.13+ (backend), TypeScript/Node 20+ (frontend) + FastAPI, SQLModel, Better Auth, Next.js 16+, Tailwind CSS (001-fullstack-web)
- Neon PostgreSQL (serverless) (001-fullstack-web)

## Recent Changes
- 001-fullstack-web: Added Python 3.13+ (backend), TypeScript/Node 20+ (frontend) + FastAPI, SQLModel, Better Auth, Next.js 16+, Tailwind CSS
