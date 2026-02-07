---
id: "0003"
title: "add-phase-iii-constitution"
stage: constitution
date: 2026-02-05
surface: cli
model: claude-opus-4-5
feature: none
branch: main
user: developer
command: /sp.constitution
labels: [phase-iii, ai-chatbot, mcp, stateless]
links:
  spec: none
  ticket: none
  adr: none
  pr: none
files:
  - path: .specify/memory/constitution.md
    action: updated
tests:
  - none
---

## Prompt

Use /sp.constitution to add Phase III requirements.

Phase III Additions:

New Technologies:
- OpenAI Agents SDK
- OpenAI ChatKit (UI)
- Official MCP SDK (Model Context Protocol)
- Stateless chat architecture

Phase III Principles:

1. Stateless Chat Architecture
Server holds NO conversation state. All state stored in database. Server can restart without losing conversations.

2. MCP-First Tool Design
AI agent capabilities exposed as MCP tools. Tools are stateless and database-backed.

3. Natural Language Interface
Users interact via conversational commands, not forms. AI interprets intent and calls appropriate tools.

4. Conversation Persistence
Every message (user + assistant) stored in database with conversation_id. History loaded on each request.

Technical Constraints:

MCP Tools Required (minimum 5):
- add_task
- list_tasks (with filtering)
- complete_task
- delete_task
- update_task

Database Tables:
- conversations (user_id, created_at, updated_at)
- messages (conversation_id, role, content, created_at)
- tasks (from Phase II - unchanged)

API Endpoint:
POST /api/chat
Request: { conversation_id?, message }
Response: { conversation_id, response, tool_calls[] }

Stateless Pattern:
1. Receive message
2. Load history from DB
3. Build message array
4. Run agent with tools
5. Store messages in DB
6. Return response
7. Server ready for next request (no memory)

## Response snapshot

Updated constitution from v1.1.0 to v1.2.0 (MINOR bump) with Phase III additions:

**New Principles Added (XI-XIV)**:
- XI. Stateless Chat Architecture - Server holds no conversation state in memory
- XII. MCP-First Tool Design - All AI capabilities as MCP tools
- XIII. Natural Language Interface - Conversational commands over forms
- XIV. Conversation Persistence - All messages stored in database

**New Technical Sections**:
- Phase III Technologies (OpenAI Agents SDK, ChatKit, MCP SDK)
- Chat API Standards (POST /api/chat specification)
- MCP Tool Requirements (5 minimum tools defined)
- Stateless Pattern Flow (7-step request lifecycle)
- Phase III Database Tables (conversations, messages)
- Code Standards: MCP Tool Pattern
- Code Standards: Conversation Model Pattern

**Updated Quality Gates**:
- Phase II marked as COMPLETED
- Phase III quality gates expanded with 10 criteria

## Outcome

- ✅ Impact: Constitution updated to v1.2.0 with all Phase III requirements codified
- 🧪 Tests: N/A - documentation change
- 📁 Files: 1 file updated (.specify/memory/constitution.md)
- 🔁 Next prompts: /sp.specify to create Phase III feature spec
- 🧠 Reflection: Phase III principles build on Phase II's stateless API foundation

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): N/A
- Prompt variant (if applicable): Standard constitution amendment flow
- Next experiment: None needed - successful amendment
