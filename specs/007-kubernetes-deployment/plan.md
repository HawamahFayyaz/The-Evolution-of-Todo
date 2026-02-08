# Implementation Plan: Phase IV Kubernetes Deployment

**Branch**: `007-kubernetes-deployment` | **Date**: 2026-02-08 | **Spec**: constitution v1.3.0
**Input**: Blueprint audit + constitution Phase IV principles (XV-XVII)

## Summary

Containerize the hackathon-todo application (Next.js frontend + FastAPI backend)
and deploy to a local Minikube cluster using Helm charts derived from existing
blueprints. The application connects to Neon managed PostgreSQL (no local DB).

## Technical Context

**Language/Version**: Python 3.13 (backend), TypeScript/Node 20 (frontend)
**Primary Dependencies**: FastAPI, Next.js 16, OpenAI Agents SDK, Better Auth
**Storage**: Neon PostgreSQL (external managed, no local StatefulSet)
**Testing**: Docker build verification, `helm lint`, pod health checks
**Target Platform**: Minikube (local single-node Kubernetes)
**Project Type**: Web (monorepo: frontend/ + backend/)
**Constraints**: All AI tools run in-process (no separate MCP server deployment)

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| XV. Container-First Architecture | Applies | Multi-stage Dockerfiles required |
| XVI. Declarative Infrastructure | Applies | All K8s resources in Helm templates |
| XVII. Twelve-Factor Compliance | Applies | Config via env vars, stateless, logs to stdout |
| IV. Progressive Enhancement | Applies | Containers deploy Phase III features unchanged |
| V. Cloud-Native Ready | Applies | Health checks, structured logging already exist |
| IX. Multi-User Data Isolation | Applies | JWT auth unchanged in containers |

---

## Blueprint Audit & Merge Strategy

### 1. Blueprint Reuse Map

#### From `basic-web-app/` (base template)

| File | Use | Customization |
|------|-----|---------------|
| `deployment.yaml` | Frontend + Backend pod specs | Convert `{{placeholder}}` to Helm `{{ .Values.* }}` syntax |
| `service.yaml` | ClusterIP (backend) + NodePort (frontend) | Change frontend from LoadBalancer to NodePort for Minikube |
| `ingress.yaml` | Path-based routing (`/` → frontend, `/api` → backend) | Optional for Minikube (can use NodePort directly) |
| `hpa.yaml` | Autoscaling (CPU 70%, Memory 80%) | Disabled by default for dev; enabled in values-prod.yaml |
| `configmap.yaml` | Backend + Frontend non-sensitive env vars | Add SYSTEM_PROMPT, OPENAI_MODEL, CORS origins |
| `secret.yaml` | Sensitive data template | Add OPENAI_API_KEY, OPENAI_API_BASE for OpenRouter |
| `values.yaml` | Full parameterization structure | Primary customization point |

#### From `ai-chatbot/` (chat-specific patterns to merge in)

| Pattern | Source File | What to Merge |
|---------|------------|---------------|
| **120s LLM timeouts** | `ingress.yaml:28-30` | `proxy-read-timeout: "120"`, `proxy-send-timeout: "120"` |
| **System prompt ConfigMap** | `configmap.yaml:48-53` | `SYSTEM_PROMPT` multi-line value in backend config |
| **LLM model config** | `configmap.yaml:26-27` | `OPENAI_MODEL`, `OPENAI_MAX_TOKENS`, `OPENAI_TEMPERATURE` |
| **Chat rate limiting** | `configmap.yaml:58-59` | `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS` |
| **Ingress rate limiting** | `ingress.yaml:44-45` | `limit-rps: "10"`, `limit-connections: "20"` |
| **OPENAI_API_KEY secret** | `secret.yaml:30` | Secret key for LLM API access |
| **Backend init container** | `deployment.yaml:108-111` | Skip - no local Postgres to wait for |

### 2. Removals (do NOT include from ai-chatbot)

| Resource | Reason |
|----------|--------|
| `statefulset.yaml` (entire file) | We use Neon managed PostgreSQL, not local |
| MCP Server Deployment (deployment.yaml:167-237) | Tools run in-process via `@function_tool` |
| PostgreSQL Service (service.yaml:73-93) | No local DB |
| PostgreSQL Headless Service (service.yaml:95-114) | No StatefulSet |
| MCP Server Service (service.yaml:52-72) | No MCP server |
| MCP Server HPA (hpa.yaml:70-109) | No MCP server |
| MCP Server ConfigMap (configmap.yaml:62-141) | No MCP server |
| WebSocket route (ingress.yaml:79-87) | Chat uses REST POST, not WebSocket |
| postgres-init ConfigMap (statefulset.yaml:117-197) | No local DB schema init |

### 3. Customizations Needed

| Item | Current (Blueprint) | Target (Our App) |
|------|---------------------|-------------------|
| **Image repos** | `ghcr.io/yourorg/*` | `hackathon-todo-backend:latest` (local Minikube) |
| **Frontend service type** | `LoadBalancer` | `NodePort` (Minikube) |
| **Domain/host** | `myapp.example.com` | `todo.local` or Minikube IP |
| **Secrets** | DATABASE_URL, AUTH_SECRET | + OPENAI_API_KEY, OPENAI_API_BASE (OpenRouter) |
| **Backend CMD** | `app.main:app` | `main:app` (our entry point is `main.py`) |
| **Template syntax** | `{{app.name}}` raw placeholders | `{{ .Values.app.name }}` Helm syntax |
| **ConfigMap** | Generic | Add SYSTEM_PROMPT, OPENAI_MODEL, MAX_HISTORY |
| **next.config.ts** | No standalone output | Add `output: "standalone"` |
| **Frontend health** | No `/api/health` route | Create `app/api/health/route.ts` |

### 4. Gaps Requiring Custom Implementation

#### Priority 1 (Blockers)

| Gap | Action | Source |
|-----|--------|--------|
| `backend/Dockerfile` | Create multi-stage build | `dockerfile-generator` skill |
| `frontend/Dockerfile` | Create multi-stage build | `dockerfile-generator` skill |
| `backend/.dockerignore` | Create exclusion list | `dockerfile-generator` skill |
| `frontend/.dockerignore` | Create exclusion list | `dockerfile-generator` skill |
| `frontend/app/api/health/route.ts` | Create health endpoint | Custom (simple GET → 200) |
| `frontend/next.config.ts` | Add `output: "standalone"` | 1-line edit |

#### Priority 2 (Deployment)

| Gap | Action | Source |
|-----|--------|--------|
| `k8s/Chart.yaml` | Create Helm chart metadata | `helm-chart-builder` skill |
| `k8s/values.yaml` | Merge basic-web-app + ai-chatbot values | Both blueprints |
| `k8s/values-dev.yaml` | Minikube overrides (NodePort, no HPA, 1 replica) | Custom |
| `k8s/templates/_helpers.tpl` | Template helpers (labels, names) | Custom |
| `k8s/templates/deployment.yaml` | Convert blueprint → Helm template | `basic-web-app` blueprint |
| `k8s/templates/service.yaml` | Convert blueprint → Helm template | `basic-web-app` blueprint |
| `k8s/templates/configmap.yaml` | Merge both blueprints → Helm template | Both blueprints |
| `k8s/templates/secret.yaml` | Convert blueprint → Helm template | `ai-chatbot` blueprint |
| `k8s/templates/ingress.yaml` | Merge timeouts → Helm template | Both blueprints |
| `k8s/templates/hpa.yaml` | Convert blueprint → Helm template | `basic-web-app` blueprint |
| `k8s/templates/NOTES.txt` | Post-install instructions | `helm-chart-builder` skill |

#### Priority 3 (Nice to Have)

| Gap | Action | Notes |
|-----|--------|-------|
| `docker-compose.yaml` | Local multi-container dev | From `dockerfile-generator` skill |
| NetworkPolicy | Pod-to-pod restriction | Security hardening |
| PodDisruptionBudget | HA guarantee | Production only |
| Namespace with ResourceQuota | Resource governance | Production only |

---

## Codebase Readiness Assessment

### Already Done (no work needed)

| Item | Location | Status |
|------|----------|--------|
| Backend `/health` endpoint | `backend/main.py:144` | Returns `{"status": "healthy"}` |
| Backend `/ready` endpoint | `backend/main.py:154` | Tests DB connection |
| Env var configuration | `backend/config.py` | DATABASE_URL, OPENAI_API_KEY, etc. |
| Stateless architecture | `backend/agent/` | Tools recreated per request |
| CORS configuration | `backend/main.py:76-82` | Via ALLOWED_ORIGINS env var |
| Structured error responses | `backend/main.py:23-141` | JSON error format |
| Rate limiting | `backend/rate_limiter.py` | Via slowapi |

### Needs Modification

| Item | Location | Change |
|------|----------|--------|
| `next.config.ts` | `frontend/next.config.ts` | Add `output: "standalone"` |
| Frontend health route | Does not exist | Create `app/api/health/route.ts` |

---

## Project Structure

### Documentation (this feature)

```text
specs/007-kubernetes-deployment/
├── plan.md              # This file
└── tasks.md             # Task breakdown (generated by /sp.tasks)
```

### Source Code (new files)

```text
hackathon-todo/
├── frontend/
│   ├── Dockerfile                    # NEW: Multi-stage Next.js build
│   ├── .dockerignore                 # NEW: Build context exclusions
│   └── app/api/health/route.ts       # NEW: Health check endpoint
├── backend/
│   ├── Dockerfile                    # NEW: Multi-stage FastAPI build
│   └── .dockerignore                 # NEW: Build context exclusions
├── k8s/                              # NEW: Helm chart directory
│   ├── Chart.yaml
│   ├── values.yaml
│   ├── values-dev.yaml
│   └── templates/
│       ├── _helpers.tpl
│       ├── deployment.yaml
│       ├── service.yaml
│       ├── configmap.yaml
│       ├── secret.yaml
│       ├── ingress.yaml
│       ├── hpa.yaml
│       └── NOTES.txt
└── docker-compose.yaml               # NEW: Local dev compose (optional)
```

---

## Order of Operations

### Phase 1: Containerization (Docker)

**Goal**: Both services build and run as containers locally.

```
Step 1.1: Frontend preparation
  - Add output: "standalone" to next.config.ts
  - Create app/api/health/route.ts

Step 1.2: Dockerfiles
  - Create backend/Dockerfile (multi-stage, python:3.13-slim)
  - Create backend/.dockerignore
  - Create frontend/Dockerfile (multi-stage, node:20-alpine)
  - Create frontend/.dockerignore

Step 1.3: Verification
  - docker build -t hackathon-todo-backend:latest ./backend
  - docker build -t hackathon-todo-frontend:latest ./frontend
  - docker run (smoke test each container)
```

### Phase 2: Helm Chart Creation

**Goal**: All K8s resources defined as parameterized Helm templates.

```
Step 2.1: Chart scaffolding
  - Create k8s/Chart.yaml
  - Create k8s/templates/_helpers.tpl
  - Create k8s/values.yaml (merged from both blueprints)
  - Create k8s/values-dev.yaml (Minikube overrides)

Step 2.2: Core templates (from basic-web-app blueprint)
  - Create k8s/templates/deployment.yaml (frontend + backend)
  - Create k8s/templates/service.yaml (NodePort + ClusterIP)
  - Create k8s/templates/secret.yaml

Step 2.3: Config templates (merged from both blueprints)
  - Create k8s/templates/configmap.yaml (+ system prompt, model config)
  - Create k8s/templates/ingress.yaml (+ 120s LLM timeouts)
  - Create k8s/templates/hpa.yaml

Step 2.4: Verification
  - helm lint k8s/
  - helm template todo-app k8s/ -f k8s/values-dev.yaml
  - Create k8s/templates/NOTES.txt
```

### Phase 3: Minikube Deployment

**Goal**: Application running end-to-end in Kubernetes.

```
Step 3.1: Cluster setup
  - minikube start
  - minikube addons enable ingress (if using ingress)
  - minikube addons enable metrics-server (for HPA)
  - eval $(minikube docker-env) (use Minikube's Docker daemon)

Step 3.2: Build images in Minikube
  - docker build -t hackathon-todo-backend:latest ./backend
  - docker build -t hackathon-todo-frontend:latest ./frontend

Step 3.3: Deploy
  - helm install todo-app k8s/ -f k8s/values-dev.yaml
  - kubectl get pods (verify all running)
  - kubectl get svc (get NodePort URL)

Step 3.4: Verification
  - curl <minikube-ip>:<node-port>/api/health (backend)
  - curl <minikube-ip>:<node-port>/ (frontend)
  - Full E2E test: login, create task, chat
```

### Phase 4: Production Readiness (Optional)

```
Step 4.1: Enable HPA
  - helm upgrade todo-app k8s/ (with autoscaling.enabled: true)

Step 4.2: Security hardening
  - Add securityContext (non-root, read-only filesystem)
  - Verify no secrets in images

Step 4.3: docker-compose.yaml for local dev alternative
```

---

## Blueprint Merge Strategy (Detailed)

### Deployment Template Merge

**Source**: `basic-web-app/deployment.yaml` (structure) + `ai-chatbot/deployment.yaml` (backend secrets)

**Merge rules**:
1. Take frontend deployment from `basic-web-app` (identical in both)
2. Take backend deployment from `basic-web-app` as base
3. Add `OPENAI_API_KEY` secret ref from `ai-chatbot/deployment.yaml:134-138`
4. Add `OPENAI_API_BASE` env var (custom - for OpenRouter)
5. Skip `initContainers` wait-for-postgres (no local DB)
6. Skip MCP server deployment entirely
7. Add `securityContext.runAsNonRoot: true` from blueprints
8. Convert all `{{placeholder}}` to `{{ .Values.* }}` Helm syntax

### ConfigMap Merge

**Source**: `basic-web-app/configmap.yaml` (structure) + `ai-chatbot/configmap.yaml` (chat settings)

**Merge rules**:
1. Take backend ConfigMap structure from `basic-web-app`
2. Merge in from `ai-chatbot`:
   - `OPENAI_MODEL`, `OPENAI_MAX_TOKENS`, `OPENAI_TEMPERATURE`
   - `SYSTEM_PROMPT` (multi-line value)
   - `MAX_HISTORY_MESSAGES`, `MAX_CONVERSATION_TOKENS`
   - `RATE_LIMIT_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS`
3. Take frontend ConfigMap from `basic-web-app`
4. Skip MCP Server ConfigMap entirely
5. Skip Shared ConfigMap (not needed)

### Ingress Merge

**Source**: `basic-web-app/ingress.yaml` (routes) + `ai-chatbot/ingress.yaml` (timeouts)

**Merge rules**:
1. Take routing structure from `basic-web-app` (`/api` → backend, `/` → frontend)
2. Merge in from `ai-chatbot`:
   - `proxy-read-timeout: "120"` (for LLM responses)
   - `proxy-send-timeout: "120"`
   - `proxy-body-size: "10m"`
   - Rate limiting annotations
3. Skip WebSocket route (`/ws`)
4. Skip `/health` route in ingress (accessed internally via probes)

### Secret Merge

**Source**: `basic-web-app/secret.yaml` (structure) + `ai-chatbot/secret.yaml` (OpenAI key)

**Merge rules**:
1. Take structure from `basic-web-app`
2. Keys: `DATABASE_URL`, `AUTH_SECRET` (from basic-web-app)
3. Add: `OPENAI_API_KEY` (from ai-chatbot)
4. Add: `OPENAI_API_BASE` (custom - for OpenRouter compatibility)
5. Use `stringData` for dev, `data` (base64) for production

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Next.js standalone build fails | Test `npm run build` with `output: "standalone"` before Docker |
| Neon cold start timeout in K8s | Backend already has retry logic; readiness probe handles delay |
| Large Docker images | Multi-stage builds; verify final image < 500MB |
| Minikube resource limits | Use values-dev.yaml with minimal resources |
| OpenRouter API base URL not respected | Verify OPENAI_API_BASE env var propagates to openai-agents SDK |
| CORS issues from Minikube IP | Set ALLOWED_ORIGINS to include Minikube IP in ConfigMap |

---

## Complexity Tracking

No constitution violations expected. All changes are additive (new files).
Application code changes are minimal (1 config edit + 1 new route).
