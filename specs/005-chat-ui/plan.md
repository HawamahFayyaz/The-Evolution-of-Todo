# Implementation Plan: Chat UI Interface

**Branch**: `005-chat-ui` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-chat-ui/spec.md`

## Summary

Build a chat interface for AI-powered task management using the DoNext design system. The UI integrates with the Chat API (004-chat-api) to provide a conversational experience with real-time message display, loading indicators, auto-scroll, tool call transparency, and responsive mobile support.

## Technical Context

**Language/Version**: TypeScript 5.x with React 19
**Primary Dependencies**: Next.js 16+ App Router, Tailwind CSS v4, React hooks
**Storage**: Conversation data via Chat API (persisted in PostgreSQL by backend)
**Testing**: Jest/Vitest for unit tests, Playwright for E2E
**Target Platform**: Modern browsers (Chrome, Firefox, Safari, Edge), Mobile responsive
**Project Type**: Web application (frontend component)
**Performance Goals**: Message input ready in 1 second, history loads in 2 seconds
**Constraints**: Mobile viewport minimum 320px, maximum 2000 character messages
**Scale/Scope**: Single chat interface integrated into existing dashboard

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| II. Accessibility First | ✅ PASS | Keyboard navigation (Enter/Shift+Enter), clear visual distinction, error messages with guidance |
| V. Cloud-Native Ready | ✅ PASS | Stateless UI, all state fetched from Chat API, no client-side conversation cache |
| VII. Full-Stack Consistency | ✅ PASS | TypeScript types match API response schema (conversation_id, response, tool_calls) |
| X. Monorepo Organization | ✅ PASS | Components in `frontend/components/chat/`, follows existing structure |
| XIII. Natural Language Interface | ✅ PASS | Chat input accepts free-form text, displays AI responses naturally |
| XIV. Conversation Persistence | ✅ PASS | UI loads history from API, preserves messages across page refreshes |

## Project Structure

### Documentation (this feature)

```text
specs/005-chat-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/sp.tasks command)
```

### Source Code (repository root)

```text
frontend/
├── app/
│   └── dashboard/
│       └── chat/
│           └── page.tsx          # Chat page (Server Component wrapper)
├── components/
│   ├── chat/
│   │   ├── index.ts              # Barrel export
│   │   ├── chat-container.tsx    # Main chat component (Client)
│   │   ├── chat-message.tsx      # Message display (user/AI)
│   │   ├── chat-input.tsx        # Input with send button
│   │   ├── chat-loading.tsx      # Typing indicator
│   │   ├── chat-empty-state.tsx  # Welcome message
│   │   ├── chat-error.tsx        # Error display with retry
│   │   └── tool-call-badge.tsx   # Tool call indicator
│   └── ui/
│       └── (existing components) # Button, Input, Card reused
├── lib/
│   └── api/
│       └── chat.ts               # Chat API client functions
└── types/
    └── chat.ts                   # Chat-specific TypeScript types
```

**Structure Decision**: Extends existing frontend/ structure with new `components/chat/` directory. Chat page added under dashboard for protected route access. Follows established patterns from Phase II (Button, Input components).

## Complexity Tracking

> No violations identified - feature uses existing infrastructure (Auth, API client, UI components).

---

## Phase 0: Research

### 0.1 Existing Codebase Analysis

**Relevant existing code**:
- `frontend/components/ui/button.tsx`: Reusable button with variants (primary, secondary, etc.) and loading state
- `frontend/components/ui/input.tsx`: Form input component
- `frontend/lib/api/client.ts`: Base API client with JWT injection
- `frontend/app/dashboard/layout.tsx`: Protected layout with auth check pattern
- `frontend/components/tasks/task-list.tsx`: Empty state pattern reference

**Design system tokens** (from Indigo Dream):
- Primary: `bg-indigo-600`, `text-indigo-600`, `hover:bg-indigo-700`
- User messages: Indigo theme (right-aligned)
- AI messages: Neutral/gray theme (left-aligned)
- Surface: `bg-gray-50` (chat container background)
- Border: `border-gray-200`

### 0.2 API Integration Points

**Chat API Contract** (from 004-chat-api spec):
```typescript
// Request
POST /api/chat
{
  conversation_id?: string;  // Optional, creates new if omitted
  message: string;           // User's message text
}

// Response
{
  conversation_id: string;   // Always returned
  response: string;          // AI response text
  tool_calls?: Array<{
    tool: string;            // Tool name (e.g., "add_task")
    args: object;            // Tool arguments
    result: object;          // Tool result
  }>;
}
```

**Error responses**:
- 401: Unauthorized (redirect to login)
- 404: Conversation not found
- 422: Validation error (empty message, too long)
- 500: Server error (show friendly message + fallback)

### 0.3 Third-Party Library Evaluation

| Library | Purpose | Decision |
|---------|---------|----------|
| OpenAI ChatKit | Chat UI components | DEFER - evaluate after MVP with custom components |
| react-textarea-autosize | Growing textarea | CONSIDER - lightweight, matches FR-010 |
| framer-motion | Animations | SKIP - use CSS transitions for simplicity |

**Recommendation**: Build custom components first using existing UI primitives. Evaluate ChatKit integration as enhancement in future iteration.

---

## Phase 1: Design

### 1.1 Component Architecture

```
ChatPage (Server Component)
└── ChatContainer (Client Component)
    ├── ChatMessageList
    │   ├── ChatEmptyState (when no messages)
    │   └── ChatMessage[] (mapped from history)
    │       └── ToolCallBadge[] (if tool_calls present)
    ├── ChatLoading (when AI processing)
    ├── ChatError (when error occurred)
    └── ChatInput
        ├── Textarea
        └── SendButton
```

### 1.2 State Management

```typescript
interface ChatState {
  conversationId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: ChatError | null;
  inputValue: string;
}
```

State lives in `ChatContainer` using React `useState`. No external state management library needed.

### 1.3 Data Flow

1. **Page Load**:
   - Check for existing conversation_id in URL or localStorage
   - If exists, fetch history via `GET /api/conversations/{id}/messages`
   - If not, show empty state

2. **Send Message**:
   - Optimistically add user message to UI
   - Call `POST /api/chat` with message and conversation_id
   - On success: add AI response, update conversation_id
   - On error: show error state, offer retry

3. **Auto-scroll**:
   - Track scroll position with ref
   - If at bottom when new message arrives, scroll down
   - If user scrolled up, show "new message" indicator

### 1.4 Component Specifications

#### ChatContainer
- **Props**: None (fetches own data)
- **State**: Full chat state
- **Behavior**: Manages all chat logic, coordinates children

#### ChatMessage
- **Props**: `{ message: ChatMessage }`
- **Variants**: User (right, indigo), Assistant (left, gray)
- **Features**: Renders tool call badges if present

#### ChatInput
- **Props**: `{ onSend, disabled, value, onChange }`
- **Features**:
  - Enter sends, Shift+Enter new line
  - Grows with content (max 5 lines)
  - Character counter near limit
  - Disabled during loading

#### ChatLoading
- **Props**: None
- **Visual**: Three animated dots with "DoNext is thinking..."

#### ChatEmptyState
- **Props**: None
- **Content**: Welcome message with example prompts

#### ChatError
- **Props**: `{ error, onRetry, onFallback }`
- **Features**: User-friendly message, retry button, fallback link

#### ToolCallBadge
- **Props**: `{ toolCall }`
- **Visual**: Pill with icon and human-readable tool name

### 1.5 Responsive Design

**Desktop (>= 768px)**:
- Chat centered with max-width 800px
- Input fixed at bottom of chat area
- Side padding for comfortable reading

**Mobile (< 768px)**:
- Full-width chat
- Input fixed at screen bottom
- Keyboard-aware positioning

### 1.6 Type Definitions

```typescript
// types/chat.ts

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  createdAt: string;
}

export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface ChatError {
  type: 'auth' | 'validation' | 'server' | 'network';
  message: string;
  retryable: boolean;
}

export interface ChatApiResponse {
  conversation_id: string;
  response: string;
  tool_calls?: ToolCall[];
}

export interface ChatApiRequest {
  conversation_id?: string;
  message: string;
}
```

### 1.7 API Client

```typescript
// lib/api/chat.ts

import { apiClient } from './client';
import type { ChatApiRequest, ChatApiResponse, ChatMessage } from '@/types/chat';

export async function sendMessage(request: ChatApiRequest): Promise<ChatApiResponse> {
  return apiClient<ChatApiResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function getConversationHistory(
  conversationId: string
): Promise<ChatMessage[]> {
  return apiClient<ChatMessage[]>(`/api/conversations/${conversationId}/messages`);
}
```

---

## Implementation Tasks Preview

The following tasks will be generated by `/sp.tasks`:

1. **Create chat types** - TypeScript interfaces for chat data
2. **Create chat API client** - API functions for chat operations
3. **Build ChatMessage component** - Message display with variants
4. **Build ToolCallBadge component** - Tool call indicator
5. **Build ChatInput component** - Input with keyboard handling
6. **Build ChatLoading component** - Typing indicator
7. **Build ChatEmptyState component** - Welcome screen
8. **Build ChatError component** - Error display with actions
9. **Build ChatContainer component** - Main orchestrator
10. **Create chat page** - Dashboard route integration
11. **Add view toggle** - Switch between chat and task list
12. **Write unit tests** - Component tests
13. **Write integration tests** - Full flow tests
14. **Mobile responsiveness** - Viewport testing and fixes

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Chat API not ready | Mock API responses during development |
| Performance with long history | Virtualize message list if >100 messages |
| Mobile keyboard issues | Test on real devices, use viewport units |
| Auth token expiry mid-chat | Intercept 401, prompt re-login |

---

## Definition of Done

- [ ] All 10 user stories have passing acceptance tests
- [ ] Components follow DoNext design system
- [ ] Mobile responsive on 320px+ viewports
- [ ] Loading states prevent duplicate submissions
- [ ] Error states offer actionable next steps
- [ ] Keyboard navigation works (Enter, Shift+Enter, Tab)
- [ ] Auto-scroll works correctly in all cases
- [ ] Tool call badges display human-readable names
- [ ] View toggle navigates correctly
- [ ] Unit test coverage > 80%
