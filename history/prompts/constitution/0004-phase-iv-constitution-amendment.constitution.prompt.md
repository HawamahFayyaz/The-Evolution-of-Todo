---
id: "0004"
title: "phase-iv-constitution-amendment"
stage: constitution
date: 2026-02-08
surface: claude-code
model: claude-opus-4-6
feature: none
branch: 006-chat-backend
user: hawamah
command: /sp.constitution
labels: [phase-iv, kubernetes, docker, helm, constitution]
links:
  spec: n/a
  ticket: n/a
  adr: n/a
  pr: n/a
files:
  - path: .specify/memory/constitution.md
    action: updated
tests:
  - none
---

## Prompt

Based on blueprint audit, add Phase IV requirements to constitution.md:
PHASE IV: Kubernetes Deployment. USE BLUEPRINTS: basic-web-app as base for K8s
configs, ai-chatbot for chat-specific patterns (120s timeouts, system prompt
config). SKIP: MCP Server deployment (in-process tools), PostgreSQL StatefulSet
(Neon managed DB), WebSocket routes (REST). New technologies: Docker, Docker
Desktop + Gordon, Kubernetes (Minikube), Helm, kubectl-ai / kagent. Three
principles: Container-First Architecture, Declarative Infrastructure,
Cloud-Native Twelve-Factor Compliance. Technical constraints for
containerization, K8s resources, Helm charts, AIOps tools. Updated quality gates
with expanded Phase IV definition of done.

## Response snapshot

Updated constitution from v1.2.0 to v1.3.0 (MINOR bump - new principles and
sections added). Changes: (1) Marked Phase III as COMPLETED, Phase IV as CURRENT.
(2) Added 3 new principles: XV Container-First Architecture, XVI Declarative
Infrastructure, XVII Cloud-Native Twelve-Factor Compliance. (3) Added Phase IV
Technologies section (Docker, Minikube, Helm, kubectl-ai, Gordon, NGINX Ingress).
(4) Added Phase IV Blueprint Usage table documenting what to use/skip from
basic-web-app and ai-chatbot blueprints. (5) Added Phase IV Project Structure
showing k8s/ directory with Helm chart layout. (6) Added Containerization
Standards (multi-stage Dockerfiles, non-root, .dockerignore). (7) Added
Kubernetes Resource Requirements table (replica counts, service types, HPA,
ingress with 120s timeouts). (8) Added Helm Chart Standards with structure and
values.yaml requirements. (9) Added AIOps Tools section (Gordon, kubectl-ai,
kagent). (10) Added Code Standards for Dockerfile and Helm Values patterns.
(11) Added 3 forbidden patterns (Secrets in Images, Root Containers, Imperative
Infrastructure). (12) Added Phase IV security requirements. (13) Expanded Phase
IV quality gates from 7 to 14 items. All templates verified compatible.

## Outcome

- ✅ Impact: Constitution v1.3.0 now fully covers Phase IV Kubernetes requirements
- 🧪 Tests: n/a (governance document)
- 📁 Files: 1 file updated (.specify/memory/constitution.md)
- 🔁 Next prompts: /sp.specify for Phase IV feature spec, then /sp.plan and /sp.tasks
- 🧠 Reflection: Blueprint audit first was the right approach - constitution now references concrete blueprint decisions rather than abstract requirements

## Evaluation notes (flywheel)

- Failure modes observed: none
- Graders run and results (PASS/FAIL): n/a
- Prompt variant (if applicable): n/a
- Next experiment (smallest change to try): n/a
