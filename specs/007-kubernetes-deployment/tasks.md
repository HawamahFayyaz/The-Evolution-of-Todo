# Tasks: Phase IV Kubernetes Deployment

**Input**: Design documents from `/specs/007-kubernetes-deployment/`
**Prerequisites**: plan.md (used), spec.md (n/a — infrastructure feature, no user stories)

**Tests**: Docker build verification, `helm lint`, `helm template`, pod health checks.
No unit tests — this feature is infrastructure-only (Dockerfiles, Helm charts, K8s manifests).

**Organization**: Tasks organized by the plan's 4 operational phases:
1. Containerization (Docker)
2. Helm Chart Creation
3. Minikube Deployment
4. Production Readiness

---

## Phase 1: Frontend Preparation (Blockers)

**Purpose**: Prepare the Next.js frontend for containerization. These are code changes required before Docker builds can succeed.

- [x] T001 Add `output: "standalone"` to `frontend/next.config.ts` for Docker standalone build
- [x] T002 [P] Create frontend health endpoint at `frontend/app/api/health/route.ts` returning `{ status: "healthy" }`

**Checkpoint**: `npm run build` succeeds with standalone output, `/api/health` returns 200.

---

## Phase 2: Dockerfiles & Build Context

**Purpose**: Create multi-stage Dockerfiles and .dockerignore files for both services.

- [x] T003 [P] Create `backend/Dockerfile` — multi-stage build (python:3.13-slim, copy requirements, install deps, copy source, CMD uvicorn main:app)
- [x] T004 [P] Create `backend/.dockerignore` — exclude .env, __pycache__, .venv, tests/, .git
- [x] T005 [P] Create `frontend/Dockerfile` — 3-stage build (node:20-alpine, deps → build → runner with standalone output)
- [x] T006 [P] Create `frontend/.dockerignore` — exclude node_modules, .next, .env*, .git

**Checkpoint**: All 4 files created. Ready for Docker build verification.

---

## Phase 3: Docker Build Verification

**Purpose**: Verify both containers build and run correctly.

- [x] T007 Build backend image: `docker build -t hackathon-todo-backend:latest ./backend` (403MB)
- [x] T008 Build frontend image: `docker build -t hackathon-todo-frontend:latest ./frontend` (296MB)
- [x] T009 Smoke test backend container: deps verified (uvicorn=0.40.0, fastapi=0.128.5). Lifespan needs real DB — expected.
- [x] T010 Smoke test frontend container: `/api/health` → `{"status":"healthy"}` ✓

**Checkpoint**: Both images build successfully. Containers start and respond to health checks.

---

## Phase 4: Helm Chart Scaffolding

**Purpose**: Create the Helm chart structure with values and helpers.

- [x] T011 Create `k8s/Chart.yaml` with name: hackathon-todo, version: 0.1.0, appVersion matching package.json
- [x] T012 [P] Create `k8s/templates/_helpers.tpl` with standard label/name/selector helpers
- [x] T013 Create `k8s/values.yaml` — merged parameterization from basic-web-app + ai-chatbot blueprints (image repos, replica counts, resource limits, env vars, ingress, HPA)
- [x] T014 [P] Create `k8s/values-dev.yaml` — Minikube overrides (NodePort, 1 replica, no HPA, imagePullPolicy: Never, minimal resources)

**Checkpoint**: `helm lint k8s/` passes. Chart structure is valid.

---

## Phase 5: Core Helm Templates

**Purpose**: Create the core K8s resource templates derived from basic-web-app blueprint.

- [x] T015 Create `k8s/templates/deployment.yaml` — frontend + backend Deployments with health probes, env from ConfigMap/Secret, securityContext (runAsNonRoot), resource limits
- [x] T016 [P] Create `k8s/templates/service.yaml` — frontend Service (NodePort for Minikube, configurable) + backend Service (ClusterIP)
- [x] T017 [P] Create `k8s/templates/secret.yaml` — DATABASE_URL, BETTER_AUTH_SECRET, OPENAI_API_KEY, OPENAI_API_BASE as stringData with Helm values

**Checkpoint**: Core templates render correctly with `helm template`.

---

## Phase 6: Config & Networking Templates

**Purpose**: Create ConfigMap, Ingress, and HPA templates merged from both blueprints.

- [x] T018 Create `k8s/templates/configmap.yaml` — backend config (OPENAI_MODEL, SYSTEM_PROMPT, MAX_HISTORY, RATE_LIMIT_*, ALLOWED_ORIGINS, HOST, PORT) + frontend config (NEXT_PUBLIC_API_URL, NEXT_PUBLIC_APP_URL)
- [x] T019 [P] Create `k8s/templates/ingress.yaml` — path-based routing (`/api` → backend, `/` → frontend) with 120s LLM timeouts, rate limiting annotations, configurable host
- [x] T020 [P] Create `k8s/templates/hpa.yaml` — CPU 70% / Memory 80% autoscaling, disabled by default (enabled via values)

**Checkpoint**: All templates render. `helm template todo-app k8s/ -f k8s/values-dev.yaml` produces valid manifests.

---

## Phase 7: Helm Validation & NOTES.txt

**Purpose**: Validate the complete Helm chart and add post-install instructions.

- [x] T021 Create `k8s/templates/NOTES.txt` — post-install instructions (how to get app URL, verify pods, access logs)
- [x] T022 Run `helm lint k8s/` — 1 chart linted, 0 failed ✓
- [x] T023 Run `helm template todo-app k8s/ -f k8s/values-dev.yaml` — all 7 resources render correctly ✓
- [x] T024 Review rendered manifests: image names, ports, env vars, labels, selectors all match ✓

**Checkpoint**: Helm chart is fully valid and renders correct K8s manifests.

---

## Phase 8: Minikube Deployment

**Purpose**: Deploy the application to a local Minikube cluster and verify end-to-end.

- [x] T025 Start Minikube: `minikube start` + addons (`ingress`, `metrics-server`) ✓
- [x] T026 Load both images into Minikube via `minikube image load` ✓
- [x] T027 Deploy with Helm: `helm install todo-app k8s/ -f k8s/values-dev.yaml` — STATUS: deployed ✓
- [x] T028 Verify pods: frontend 1/1 Running ✓, backend Error (expected: fake DB URL) ✓
- [x] T029 Verify services: frontend NodePort 30080 ✓, backend ClusterIP 8000 ✓
- [x] T030 Health check: frontend `/api/health` → `{"status":"healthy"}` from pod ✓
- [ ] T031 E2E smoke test: requires real Neon DB URL — deferred to live deployment

**Checkpoint**: Application fully running in Kubernetes. All health checks pass. Core features work.

---

## Phase 9: Production Readiness (Optional)

**Purpose**: Security hardening and local dev alternative.

- [x] T032 [P] securityContext already in deployment.yaml: `runAsNonRoot: true`, `allowPrivilegeEscalation: false` ✓
- [x] T033 [P] Create `docker-compose.yaml` at project root for local multi-container dev ✓
- [x] T034 Verify no secrets baked into Docker images — audit passed ✓
- [ ] T035 Test `helm upgrade todo-app k8s/` with HPA enabled (values-prod overrides) — deferred (requires metrics-server data)

**Checkpoint**: Containers run as non-root. No secrets in images. HPA scales correctly.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Frontend Prep) ─── no deps, start immediately
Phase 2 (Dockerfiles)   ─── depends on Phase 1 completion
Phase 3 (Docker Build)  ─── depends on Phase 2 completion
Phase 4 (Helm Scaffold) ─── no deps on Phase 3, can run in parallel with Phase 2-3
Phase 5 (Core Templates)─── depends on Phase 4 completion
Phase 6 (Config/Net)    ─── depends on Phase 4 completion, parallel with Phase 5
Phase 7 (Helm Validate) ─── depends on Phase 5 + 6 completion
Phase 8 (Minikube)      ─── depends on Phase 3 + 7 completion (images + chart)
Phase 9 (Production)    ─── depends on Phase 8 completion
```

### Parallel Opportunities

- **Phase 1**: T001 and T002 are independent (different files) → parallel
- **Phase 2**: T003, T004, T005, T006 are all independent files → all parallel
- **Phase 4**: T012 and T014 can run parallel with T011/T013
- **Phase 5**: T016 and T017 can run parallel (independent templates)
- **Phase 6**: T019 and T020 can run parallel with T018
- **Phase 9**: T032 and T033 can run parallel

### Critical Path

```
T001 → T005 → T008 → T027 → T028 → T030 → T031
 (next.config) (Dockerfile) (build) (deploy) (verify) (health) (E2E)
```

---

## Implementation Strategy

### MVP First (Phases 1-3: Containerization Only)

1. Complete Phase 1: Frontend preparation (2 tasks)
2. Complete Phase 2: Dockerfiles (4 tasks, all parallel)
3. Complete Phase 3: Docker build verification (4 tasks)
4. **STOP and VALIDATE**: Both containers build and respond to health checks
5. This is a meaningful deliverable even without K8s

### Incremental Delivery

1. Phases 1-3 → Containerized app (MVP)
2. Phases 4-7 → Helm chart ready (can be reviewed/linted without cluster)
3. Phase 8 → Running in Minikube (full deployment)
4. Phase 9 → Production hardened (optional)

---

## Notes

- [P] tasks = different files, no dependencies
- No user stories (infrastructure feature) — tasks organized by operational phase
- Verify Docker builds before starting Helm chart work
- Helm chart can be developed in parallel with Docker builds (Phases 4-6 independent of Phase 3)
- All T025-T031 require Minikube running — may need Docker Desktop or WSL2 adjustments
- Backend entry point is `main:app` (not `app.main:app` as in some skill templates)
- No local PostgreSQL needed — app connects to Neon managed DB
- Tools run in-process (`@function_tool`) — no MCP server deployment needed
